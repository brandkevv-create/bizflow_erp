-- Expense Categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Status Enum
CREATE TYPE expense_status AS ENUM ('pending', 'paid', 'cancelled');

-- Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL UNIQUE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor TEXT,
    receipt_url TEXT,
    status expense_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expense_categories
CREATE POLICY "Enable read access for all authenticated users" ON expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for admins and managers" ON expense_categories FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
);

-- Policies for expenses
CREATE POLICY "Enable read access for all authenticated users" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for admins and managers" ON expenses FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
);

-- Trigger for expenses
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed data for Expense Categories
INSERT INTO expense_categories (name, description) VALUES
    ('Rent', 'Monthly rent for retail and warehouse spaces'),
    ('Utilities', 'Electricity, water, internet, etc.'),
    ('Payroll', 'Employee salaries and wages'),
    ('Marketing', 'Advertising and promotional expenses'),
    ('Office Supplies', 'General office materials and equipment'),
    ('Software Subscriptions', 'Monthly SaaS tools and hosting'),
    ('Maintenance', 'Repairs and general upkeep')
ON CONFLICT (name) DO NOTHING;
