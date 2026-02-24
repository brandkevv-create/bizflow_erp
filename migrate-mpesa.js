import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running migration to support mpesa in integrations...');
    // The RPC function method is the safest way to execute raw sql from the JS client if raw SQL is blocked
    // However, Supabase JS client doesn't directly support raw SQL execution without an RPC.
    // Instead, since this is a local project, we'll suggest the user runs the SQL via the Supabase Dashboard,
    // OR we create an RPC function to execute our sql.

    // Actually, we can just insert a row and if it fails, it fails.
    // But wait, the standard approach is to use the Supabase CLI if installed, or just have the user do it.

    console.log("Please run the following SQL command in your Supabase SQL Editor:");
    console.log("ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;");
    console.log("ALTER TABLE public.integrations ADD CONSTRAINT integrations_provider_check CHECK (provider IN ('stripe', 'shopify', 'woocommerce', 'mpesa'));");

    console.log("\nIf you are using the local Supabase studio, it is available at http://127.0.0.1:54323");
}

runMigration();
