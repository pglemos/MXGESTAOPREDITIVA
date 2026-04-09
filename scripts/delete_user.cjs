const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteUser() {
    // 1. Encontrar o usuário pelo email
    const { data: users, error } = await supabase.auth.admin.listUsers();
    const target = users.users.find(u => u.email === 'admin@mxgestaopreditiva.com.br');
    
    if (target) {
        console.log('Deletando usuário:', target.id);
        await supabase.auth.admin.deleteUser(target.id);
        console.log('Usuário deletado.');
    } else {
        console.log('Usuário não encontrado.');
    }
}
deleteUser().catch(console.error);
