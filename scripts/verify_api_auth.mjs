import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const users = [
  { email: 'danieljsvendas@gmail.com', pass: 'WKDTVGWN', name: 'DANIEL JS' },
  { email: 'luzdirecaoconsultoria@gmail.com', pass: 'R5K2B4AZ', name: 'JOSE ROBERTO' },
  { email: 'davidgundam081@gmail.com', pass: 'BKAP23', name: 'DAVID' },
  { email: 'caiio.ce@hotmail.com', pass: 'B9C2KDT8', name: 'CAIO' }
];

async function verifyAuth() {
  console.log('--- TESTE DE AUTENTICAÇÃO DIRETA (API) ---');
  
  for (const u of users) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.pass
    })
    
    if (error) {
      console.log(`❌ ${u.name}: FALHA API (${error.message})`);
    } else {
      console.log(`✅ ${u.name}: SUCESSO API (JWT Gerado)`);
    }
  }
}

verifyAuth();
