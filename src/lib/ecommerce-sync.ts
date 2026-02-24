import { supabase } from '@/lib/supabase';

export async function processExternalOrder(
    provider: 'shopify' | 'woocommerce',
    externalOrderId: string,
    customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    },
    orderData: {
        totalAmount: number;
        status: 'Pending' | 'Paid' | 'Completed' | 'Cancelled';
        currency?: string;
    },
    items: {
        sku: string;
        name: string;
        quantity: number;
        unitPrice: number;
    }[]
) {
    try {
        console.log(`Processing ${provider} order: ${externalOrderId}`);

        // 1. Find or create Customer
        let customerId: string | undefined = undefined;
        if (customerData.email) {
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('email', customerData.email)
                .single();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const { data: newCustomer, error: custError } = await supabase
                    .from('customers')
                    .insert({
                        full_name: `${customerData.firstName} ${customerData.lastName}`.trim(),
                        email: customerData.email,
                        phone: customerData.phone || null,
                    })
                    .select('id')
                    .single();

                if (custError) throw new Error(`Customer creation failed: ${custError.message}`);
                customerId = newCustomer.id;
            }
        }

        // 2. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_id: customerId || null,
                total_amount: orderData.totalAmount,
                status: orderData.status,
                // store original platform order ID in notes or metadata if a field was added
                notes: `Source: ${provider.toUpperCase()}, External ID: ${externalOrderId}`
            })
            .select('id')
            .single();

        if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

        // 3. Process Items & Inventory
        // To accurately deduct inventory, we need a target location.
        // We'll use the default active location (e.g. "Main Store") for now.
        const { data: defaultLocation } = await supabase
            .from('locations')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (!defaultLocation) throw new Error('No active location found to deduct stock from.');

        for (const item of items) {
            // Find Product by SKU
            const { data: product } = await supabase
                .from('products')
                .select('id')
                .eq('sku', item.sku)
                .single();

            let productId = product?.id;

            // If product doesn't exist, we might create it or throw error.
            if (!productId) {
                console.warn(`Product SKU not found: ${item.sku}. Creating stub product...`);
                const { data: newProd, error: newProdError } = await supabase
                    .from('products')
                    .insert({
                        name: item.name,
                        sku: item.sku,
                        price: item.unitPrice,
                        cost_price: 0
                    })
                    .select('id')
                    .single();

                if (newProdError) throw new Error(`Failed to create stub product: ${newProdError.message}`);
                productId = newProd.id;

                // Also initialize its inventory level
                await supabase.from('inventory_levels').insert({
                    product_id: productId,
                    location_id: defaultLocation.id,
                    stock_quantity: 0,
                    reorder_point: 10
                });
            }

            // Create Order Item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                    order_id: order.id,
                    product_id: productId,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    amount: item.quantity * item.unitPrice
                });

            if (itemError) console.error(`Failed to insert order item ${item.sku}`, itemError);

            // Note: We DO NOT manually deduct inventory here anymore.
            // The PostgreSQL trigger `process_order_item_inventory` automatically
            // handles stock deduction upon insertion into `order_items`.
        }

        console.log(`Successfully processed order ${order.id} from ${provider}`);
        return { success: true, orderId: order.id };

    } catch (error: any) {
        console.error(`Error processing ${provider} order:`, error);
        return { success: false, error: error.message };
    }
}
