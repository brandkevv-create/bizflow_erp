
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    cost: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    updatedAt: string;
    description?: string;
    imageUrl?: string;
    is_kit?: boolean;
    components?: { component_id: string; quantity: number; name?: string; }[];
}

export interface Location {
    id: string;
    name: string;
    type: string;
    address?: string;
    is_active: boolean;
}

interface InventoryState {
    products: Product[];
    categories: string[];
    locations: Location[];
    alerts: { lowStock: number; outOfStock: number };
    isLoading: boolean;
    error: string | null;

    totalProducts: number;
    currentPage: number;
    pageSize: number;
    searchQuery: string;
    selectedCategory: string;

    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string) => void;
    setPage: (page: number) => void;

    fetchProducts: () => Promise<void>;
    fetchCategories: () => Promise<void>;
    fetchLocations: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id' | 'updatedAt' | 'status'>) => Promise<void>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    addCategory: (category: string) => Promise<void>;
    removeCategory: (category: string) => Promise<void>;
    adjustStock: (id: string, adjustment: { type: 'add' | 'remove', quantity: number, reason: string, notes?: string }) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    products: [],
    categories: [],
    locations: [],
    alerts: { lowStock: 0, outOfStock: 0 },
    isLoading: false,
    error: null,

    totalProducts: 0,
    currentPage: 1,
    pageSize: 50, // default page size
    searchQuery: '',
    selectedCategory: 'All',

    setSearchQuery: async (query) => {
        set({ searchQuery: query, currentPage: 1 });
        await get().fetchProducts();
    },
    setSelectedCategory: async (category) => {
        set({ selectedCategory: category, currentPage: 1 });
        await get().fetchProducts();
    },
    setPage: async (page) => {
        set({ currentPage: page });
        await get().fetchProducts();
    },

    fetchProducts: async () => {
        const { currentPage, pageSize, searchQuery, selectedCategory } = get();
        set({ isLoading: true, error: null });

        try {
            let query = supabase
                .from('products')
                .select(`
                    *,
                    category:categories!inner(name),
                    inventory_levels(stock_quantity),
                    product_components!product_components_kit_id_fkey(component_id, quantity, component:products!product_components_component_id_fkey(name))
                `, { count: 'exact' });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
            }
            if (selectedCategory && selectedCategory !== 'All') {
                query = query.eq('categories.name', selectedCategory);
            }

            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const products: Product[] = data.map((item: any) => {
                const totalStock = item.inventory_levels?.reduce((sum: number, loc: any) => sum + (loc.stock_quantity || 0), 0) || 0;
                return {
                    id: item.id,
                    name: item.name,
                    sku: item.id.substring(0, 8).toUpperCase(),
                    category: item.category?.name || 'Uncategorized',
                    price: Number(item.price),
                    stock: totalStock,
                    cost: Number(item.cost_price || 0),
                    status: totalStock === 0 ? 'Out of Stock' : totalStock < 10 ? 'Low Stock' : 'In Stock',
                    updatedAt: new Date(item.updated_at).toLocaleDateString(),
                    description: item.description,
                    imageUrl: item.image_url,
                    is_kit: item.is_kit,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    components: item.product_components?.map((c: any) => ({
                        component_id: c.component_id,
                        quantity: Number(c.quantity),
                        name: c.component?.name || 'Unknown'
                    })) || [],
                };
            });

            // Note: Alerts are currently calculated based on the visible page.
            // In a fully scaled system, we would run a separate aggregation query for dashboard counts.
            const lowStock = products.filter(p => p.stock < 10 && p.stock > 0).length;
            const outOfStock = products.filter(p => p.stock === 0).length;

            set({ products, alerts: { lowStock, outOfStock }, totalProducts: count || 0 });

            // Also fetch categories if empty
            if (get().categories.length === 0) {
                await get().fetchCategories();
            }

        } catch (error: any) {
            console.error('Error fetching products:', JSON.stringify(error, null, 2));
            if (error instanceof Error) {
                set({ error: error.message });
            } else if (error && error.message) {
                set({ error: error.message });
            } else {
                set({ error: 'An unknown error occurred' });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    fetchCategories: async () => {
        try {
            const { data, error } = await supabase.from('categories').select('name');
            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            set({ categories: data.map((c: any) => c.name) });
        } catch (error: unknown) {
            console.error('Error fetching categories:', error);
            // set({ error: error.message }); // Don't block whole UI for categories
        }
    },

    fetchLocations: async () => {
        try {
            const { data, error } = await supabase.from('locations').select('*').eq('is_active', true);
            if (error) throw error;
            set({ locations: data as Location[] });
        } catch (error: unknown) {
            console.error('Error fetching locations:', error);
        }
    },

    addProduct: async (product: Omit<Product, 'id' | 'updatedAt' | 'status'>) => {
        set({ isLoading: true });
        try {
            // 1. Get Category ID (Simple lookup for now, or default)
            // In a real app we'd likely pass category_id, but UI uses name string.
            // We'll try to find the category ID by name.
            const { data: catData } = await supabase.from('categories').select('id').eq('name', product.category).single();

            // 2. Insert product
            const { data: newProd, error } = await supabase.from('products').insert({
                name: product.name,
                price: product.price,
                cost_price: product.cost,
                category_id: catData?.id,
                is_kit: product.is_kit || false,
            }).select().single();

            if (error) throw error;

            // Handle Kit Components if applies
            if (product.is_kit && product.components && product.components.length > 0) {
                const componentsToInsert = product.components.map(c => ({
                    kit_id: newProd.id,
                    component_id: c.component_id,
                    quantity: c.quantity
                }));
                const { error: compError } = await supabase.from('product_components').insert(componentsToInsert);
                if (compError) console.error("Failed to insert components:", compError);
            }

            // 3. Insert initial stock into default location (first active location)
            const { data: locData } = await supabase.from('locations').select('id').eq('is_active', true).limit(1).single();
            if (locData && newProd) {
                await supabase.from('inventory_levels').insert({
                    product_id: newProd.id,
                    location_id: locData.id,
                    stock_quantity: product.stock,
                    reorder_point: 10
                });
            }

            await get().fetchProducts();
        } catch (error: unknown) {
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    updateProduct: async (id: string, updatedProduct: Partial<Product>) => {
        set({ isLoading: true });
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updates: Partial<any> = {};
            if (updatedProduct.name) updates.name = updatedProduct.name;
            if (updatedProduct.price !== undefined) updates.price = updatedProduct.price;
            if (updatedProduct.cost !== undefined) updates.cost_price = updatedProduct.cost;
            // Note: stock_quantity updates should be done via stock adjustments, not basic product updates in a multi-location system.
            // If we still allow stock updates here, it would apply to a random/first location. For safety we ignore it here.
            // Category update would require lookup again.
            if (updatedProduct.is_kit !== undefined) updates.is_kit = updatedProduct.is_kit;

            const { error } = await supabase.from('products').update(updates).eq('id', id);
            if (error) throw error;

            // Update components if it's a kit
            if (updatedProduct.is_kit && updatedProduct.components) {
                // Delete existing
                await supabase.from('product_components').delete().eq('kit_id', id);
                // Insert new ones 
                if (updatedProduct.components.length > 0) {
                    const componentsToInsert = updatedProduct.components.map(c => ({
                        kit_id: id,
                        component_id: c.component_id,
                        quantity: c.quantity
                    }));
                    await supabase.from('product_components').insert(componentsToInsert);
                }
            }

            await get().fetchProducts();
        } catch (error: unknown) {
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProduct: async (id: string) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            await get().fetchProducts();
        } catch (error: unknown) {
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    addCategory: async (category: string) => {
        try {
            const slug = category.toLowerCase().replace(/\s+/g, '-');
            const { error } = await supabase.from('categories').insert({ name: category, slug });
            if (error) throw error;
            await get().fetchCategories();
        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        }
    },

    removeCategory: async (category: string) => {
        try {
            const { error } = await supabase.from('categories').delete().eq('name', category);
            if (error) throw error;
            await get().fetchCategories();
        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        }
    },

    adjustStock: async (id: string, { type, quantity }: { type: 'add' | 'remove', quantity: number, reason: string, notes?: string }) => {
        set({ isLoading: true });
        try {
            // Note: This logic previously adjusted products.stock_quantity directly.
            // Under multi-location, adjusting "total stock" is ambiguous. 
            // We find the first active location and adjust there for simplicity, since the modal didn't ask for location.
            const { data: locData } = await supabase.from('locations').select('id').eq('is_active', true).limit(1).single();
            if (!locData) throw new Error("No active location found to adjust stock against");

            const { data: currentLevel } = await supabase
                .from('inventory_levels')
                .select('stock_quantity')
                .eq('product_id', id)
                .eq('location_id', locData.id)
                .single();

            const baseStock = currentLevel?.stock_quantity || 0;
            const newStock = type === 'add' ? baseStock + quantity : Math.max(0, baseStock - quantity);

            const { error } = await supabase
                .from('inventory_levels')
                .upsert({
                    product_id: id,
                    location_id: locData.id,
                    stock_quantity: newStock,
                    reorder_point: 10
                }, { onConflict: 'product_id, location_id' });

            if (error) throw error;

            // Ideally log to a 'stock_adjustments' table here if we had one.

            await get().fetchProducts();
        } catch (error: unknown) {
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    }
}));
