
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for this script execution only
const supabaseUrl = 'https://wijdqgnatxrlvlmklguw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpamRxZ25hdHhybHZsbWtsZ3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjYyMjEsImV4cCI6MjA4NTYwMjIyMX0.TmS5PZXpFaxKplEQUV4oV7qe_6Kud5akH3ISv-OWLvQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoUser() {
    console.log('Creating demo user...');

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email: 'demo@bizflow.com',
        password: 'demo123',
        options: {
            data: {
                full_name: 'Demo User',
                role: 'admin'
            }
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created/fetched:', data.user?.id);
    }

    // 2. We can't verify email via client API without admin key.
    // We will rely on the SQL step to confirm email.
}

createDemoUser();
