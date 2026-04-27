const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://fbhcmzzgwjdgkctlfvbo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Starting security audit and reset...");

    // 1. Fetch all users from public.users to get their roles and store associations
    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select(`
            id, 
            email, 
            name, 
            role, 
            memberships (
                store_id, 
                stores (name)
            )
        `);

    if (fetchError) {
        console.error("Error fetching users:", fetchError);
        return;
    }

    const defaultPassword = "Mx#2026!";
    const report = {};

    console.log(`Found ${users.length} users. Starting resets...`);

    for (const user of users) {
        if (user.role === 'admin') continue; // Skip admin

        const storeName = user.memberships?.[0]?.stores?.name || "SEM LOJA";
        if (!report[storeName]) report[storeName] = [];

        try {
            // Update Auth Password
            const { error: authError } = await supabase.auth.admin.updateUserById(
                user.id,
                { password: defaultPassword }
            );

            if (authError) {
                console.error(`Error resetting password for ${user.email}:`, authError.message);
                continue;
            }

            // Update public.users flag
            await supabase
                .from('users')
                .update({ must_change_password: true })
                .eq('id', user.id);

            report[storeName].push({
                name: user.name,
                email: user.email,
                role: user.role,
                password: defaultPassword
            });

            console.log(`Reset successful for: ${user.email} (${storeName})`);
        } catch (err) {
            console.error(`Unexpected error for ${user.email}:`, err);
        }
    }

    console.log("\n--- AUDIT REPORT ---\n");
    for (const [store, members] of Object.entries(report)) {
        console.log(`\nLOJA: ${store}`);
        console.log("-------------------");
        members.forEach(m => {
            console.log(`[${m.role.toUpperCase()}] ${m.name} - ${m.email} | Senha: ${m.password}`);
        });
    }
}

run();
