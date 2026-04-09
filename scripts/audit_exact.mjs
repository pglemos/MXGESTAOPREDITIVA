import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDesvio() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    // Total na planilha
    const planTotal = baseOficial.reduce((acc, r) => acc + (r['VND_NET'] || 0), 0);
    
    // Total no banco
    const { data: dbData } = await supabase.from('daily_checkins').select('vnd_net');
    const dbTotal = dbData.reduce((acc, r) => acc + (r.vnd_net || 0), 0);
    
    console.log('Total Vendas Planilha:', planTotal);
    console.log('Total Vendas Banco:', dbTotal);
}
checkDesvio().catch(console.error);
