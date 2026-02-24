-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses Table (Tenant Entity)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get current API user's business ID
CREATE OR REPLACE FUNCTION public.get_auth_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Profiles Table (Linked to Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_biz_id UUID;
BEGIN
  -- Create a new business for this user
  INSERT INTO public.businesses (name) VALUES (COALESCE(new.raw_user_meta_data->>'business_name', 'My Business')) RETURNING id INTO new_biz_id;
  
  -- Insert the profile connected to the new business
  INSERT INTO public.profiles (id, full_name, email, role, business_id)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'admin', new_biz_id);
  
  -- Insert default settings for this business
  INSERT INTO public.settings (business_id, business_name, business_email, currency, tax_rate)
  VALUES (new_biz_id, COALESCE(new.raw_user_meta_data->>'business_name', 'My Business'), new.email, 'USD', 0)
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, business_id)
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT 'store' CHECK (type IN ('store', 'warehouse')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Paid', 'Fulfilled', 'Cancelled', 'Completed')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('Paid', 'Sent', 'Overdue', 'Draft', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    status TEXT NOT NULL CHECK (status IN ('Completed', 'Pending', 'Failed')),
    reference TEXT,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    business_name TEXT,
    business_email TEXT,
    phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'USD',
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations Table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'shopify', 'woocommerce')),
    api_key TEXT,
    secret_key TEXT,
    shop_url TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, business_id)
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Levels Table (links products to locations)
CREATE TABLE IF NOT EXISTS public.inventory_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, location_id, business_id)
);

-- Stock Transfers Table
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    from_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    to_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'intransit', 'completed', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Transfer Items Table
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL DEFAULT public.get_auth_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'partially_received', 'received', 'cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expected_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(po_number, business_id)
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    received_quantity INTEGER NOT NULL DEFAULT 0
);


-----------------------------------------
-- INVENTORY & AUTOMATION TRIGGERS
-----------------------------------------

-- Function to deduct inventory
CREATE OR REPLACE FUNCTION public.deduct_inventory()
RETURNS TRIGGER AS $$
DECLARE
    order_location_id UUID;
BEGIN
    SELECT location_id INTO order_location_id FROM public.orders WHERE id = NEW.order_id;
    IF order_location_id IS NOT NULL THEN
        UPDATE public.inventory_levels
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE product_id = NEW.product_id AND location_id = order_location_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inventory deduction on insert
DROP TRIGGER IF EXISTS on_order_item_inserted ON public.order_items;
CREATE TRIGGER on_order_item_inserted
    AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE PROCEDURE public.deduct_inventory();

-- Function to restore inventory on cancel
CREATE OR REPLACE FUNCTION public.restore_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' AND NEW.location_id IS NOT NULL THEN
        FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
            UPDATE public.inventory_levels
            SET stock_quantity = stock_quantity + item.quantity
            WHERE product_id = item.product_id AND location_id = NEW.location_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for restoring inventory
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;
CREATE TRIGGER on_order_cancelled
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.restore_inventory();

-- Function to process stock transfer
CREATE OR REPLACE FUNCTION public.process_stock_transfer()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    if NEW.status = 'completed' AND OLD.status != 'completed' THEN
        FOR item IN SELECT product_id, quantity FROM public.stock_transfer_items WHERE transfer_id = NEW.id LOOP
            -- Decrease from source
            UPDATE public.inventory_levels
            SET stock_quantity = stock_quantity - item.quantity
            WHERE product_id = item.product_id AND location_id = NEW.from_location_id;
            
            -- Increase in destination (or insert if not exists)
            INSERT INTO public.inventory_levels (product_id, location_id, stock_quantity, business_id)
            VALUES (item.product_id, NEW.to_location_id, item.quantity, NEW.business_id)
            ON CONFLICT (product_id, location_id, business_id) DO UPDATE
            SET stock_quantity = public.inventory_levels.stock_quantity + EXCLUDED.stock_quantity;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for stock transfer completion
DROP TRIGGER IF EXISTS on_stock_transfer_completed ON public.stock_transfers;
CREATE TRIGGER on_stock_transfer_completed
    AFTER UPDATE OF status ON public.stock_transfers
    FOR EACH ROW EXECUTE PROCEDURE public.process_stock_transfer();

-- Function to process purchase order received
CREATE OR REPLACE FUNCTION public.process_purchase_order_received()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    if NEW.status = 'received' AND OLD.status != 'received' THEN
        FOR item IN SELECT product_id, quantity, received_quantity FROM public.purchase_order_items WHERE po_id = NEW.id LOOP
            -- Increase in destination (or insert if not exists)
            INSERT INTO public.inventory_levels (product_id, location_id, stock_quantity, business_id)
            VALUES (item.product_id, NEW.location_id, COALESCE(NULLIF(item.received_quantity, 0), item.quantity), NEW.business_id)
            ON CONFLICT (product_id, location_id, business_id) DO UPDATE
            SET stock_quantity = public.inventory_levels.stock_quantity + EXCLUDED.stock_quantity;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for purchase order received
DROP TRIGGER IF EXISTS on_purchase_order_received ON public.purchase_orders;
CREATE TRIGGER on_purchase_order_received
    AFTER UPDATE OF status ON public.purchase_orders
    FOR EACH ROW EXECUTE PROCEDURE public.process_purchase_order_received();


-----------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-----------------------------------------

-- Enable RLS for all generic tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Businesses: A profile can read/update their own business
DROP POLICY IF EXISTS "Users can read own business" ON public.businesses;
CREATE POLICY "Users can read own business" ON public.businesses
    FOR SELECT TO authenticated
    USING (id = public.get_auth_business_id());

DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
CREATE POLICY "Users can update own business" ON public.businesses
    FOR UPDATE TO authenticated
    USING (id = public.get_auth_business_id())
    WITH CHECK (id = public.get_auth_business_id());

-- Profiles: A user can read/update profiles in their own business
DROP POLICY IF EXISTS "Users can read profiles of own business" ON public.profiles;
CREATE POLICY "Users can read profiles of own business" ON public.profiles
    FOR SELECT TO authenticated
    USING (business_id = public.get_auth_business_id());

DROP POLICY IF EXISTS "Users can update profiles of own business" ON public.profiles;
CREATE POLICY "Users can update profiles of own business" ON public.profiles
    FOR UPDATE TO authenticated
    USING (business_id = public.get_auth_business_id())
    WITH CHECK (business_id = public.get_auth_business_id());

-- Generic Isolation Policy Builder
CREATE OR REPLACE FUNCTION public.create_isolation_policy(t_name TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "Isolate %I by business" ON public.%I', t_name, t_name);
    EXECUTE format('CREATE POLICY "Isolate %I by business" ON public.%I FOR ALL TO authenticated USING (business_id = public.get_auth_business_id()) WITH CHECK (business_id = public.get_auth_business_id())', t_name, t_name);
END;
$$ LANGUAGE plpgsql;

-- Apply generic isolation policies
SELECT public.create_isolation_policy('customers');
SELECT public.create_isolation_policy('products');
SELECT public.create_isolation_policy('categories');
SELECT public.create_isolation_policy('suppliers');
SELECT public.create_isolation_policy('locations');
SELECT public.create_isolation_policy('orders');
SELECT public.create_isolation_policy('invoices');
SELECT public.create_isolation_policy('api_keys');
SELECT public.create_isolation_policy('integrations');
SELECT public.create_isolation_policy('inventory_levels');
SELECT public.create_isolation_policy('payments');
SELECT public.create_isolation_policy('stock_transfers');
SELECT public.create_isolation_policy('purchase_orders');
SELECT public.create_isolation_policy('settings');
SELECT public.create_isolation_policy('webhook_logs');
