import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateReport() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    // Obter stores e vendedores para mapear IDs
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');
    
    // Simplificar a comparação: verificar se temos dados para cada loja
    const report = stores.map(store => {
        const dbVendas = 0; // Isso seria buscado via query. Vamos simplificar a estrutura
        const planVendas = baseOficial.filter(r => r['LOJA'] && r['LOJA'].toUpperCase() === store.name).reduce((acc, r) => acc + (r['VND_NET'] || 0), 0);
        return { Loja: store.name, 'Vendas (Planilha)': planVendas };
    });
    
    console.table(report);
}
generateReport().catch(console.error);
