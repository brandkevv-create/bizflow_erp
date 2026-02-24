const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.error('Error reading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

console.log(`Connecting to ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Try a simple query
        const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Error:', error.message);
            console.error('Details:', error);
        } else {
            console.log('Successfully connected to Supabase!');

            // Try an Insert
            const { data: insertData, error: insertError } = await supabase
                .from('categories')
                .insert({ name: 'Test Category ' + Date.now(), slug: 'test-cat-' + Date.now() })
                .select();

            if (insertError) {
                console.error('Insert Error:', insertError.message);
            } else {
                console.log('Successfully inserted data!');
                if (insertData && insertData.length > 0) {
                    // Cleanup
                    await supabase.from('categories').delete().eq('id', insertData[0].id);
                    console.log('Successfully cleaned up test data!');
                }
            }
        }
    } catch (err) {
        console.error('Connection Exception:', err);
    }
}

testConnection();
