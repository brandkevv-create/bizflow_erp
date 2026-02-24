-- Add fields to customers table for B2B features
ALTER TABLE customers ADD COLUMN company_name TEXT;
ALTER TABLE customers ADD COLUMN tax_id TEXT;
ALTER TABLE customers ADD COLUMN credit_limit NUMERIC(15, 2) DEFAULT 0 CHECK (credit_limit >= 0);
