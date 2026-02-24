export type ProductStatus = 'active' | 'draft' | 'archived' | 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    cost: number;
    status: ProductStatus;
    updatedAt: string;
    description?: string;
    imageUrl?: string;
}
