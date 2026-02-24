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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
    console.log('Testing RLS policies...');

    // 1. Unauthenticated request (Should fail or return empty)
    console.log('1. Testing Unauthenticated Access...');
    const { data: anonData, error: anonError } = await supabase.from('products').select('*').limit(1);

    if (anonError) {
        console.log('   Expected Error (Access Denied?):', anonError.message); // Supabase often returns [] for RLS select denial, or error?
        // Actually RLS usually returns empty array for Select if no policy matches, unless restricted.
    } else {
        console.log(`   Count: ${anonData.length}`);
        if (anonData.length === 0) console.log('   SUCCESS: No data returned for anon user.');
        else console.warn('   WARNING: Data returned for anon user! RLS might be broken.');
    }

    // 2. Authenticated request
    console.log('\n2. Testing Authenticated Access...');
    const email = 'brandkevv@gmail.com';
    const password = 'password123';

    // Need to sign in first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('   Login failed, cannot test auth access:', authError.message);
        return;
    }

    console.log('   Logged in as:', authData.user.email);

    const { data: secureData, error: secureError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (secureError) {
        console.error('   Error accessing data:', secureError.message);
    } else {
        console.log(`   Count: ${secureData.length}`);
        if (secureData.length > 0) console.log('   SUCCESS: Data returned for authenticated user.');
        else console.warn('   WARNING: No data returned even for authenticated user.');
    }
}

testRLS();
