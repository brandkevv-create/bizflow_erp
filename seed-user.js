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

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUser() {
    const email = 'brandkevv@gmail.com';
    const password = 'password123';

    console.log(`Attempting to sign up ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Admin User',
            }
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('Sign Up Response:', data);
        if (data.user && data.session) {
            console.log('User created and logged in automatically (Email confirmation likely disabled).');
        } else if (data.user && !data.session) {
            console.log('User created but requires email confirmation.');
        }
    }
}

seedUser();
