const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { resolve } = require('path');
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runFullAudit() {
    const { data: dbData } = await supabase.from('daily_checkins').select('*');
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    console.log('--- AUDITORIA COMPLETA DE LOJAS E VENDEDORES ---');
    
    const stores = ['PAAY MOTORS', 'SEMINOVOS BHZ', 'ACERTTCAR', 'RK2 MOTORS', 'GANDINI AUTOMOVEIS', 'ESPINDOLA AUTOMOVEIS', 'DNA VEICULOS', 'BROTHERS CAR', 'LIAL VEICULOS', 'PISCAR VEICULOS'];
    
    for (const store of stores) {
        const planVendas = baseOficial.filter((r: any) => r['LOJA'].toUpperCase() === store).reduce((acc: number, r: any) => acc + (r['VND_NET'] || 0), 0);
        console.log(`LOJA: ${store.padEnd(25)} | VENDAS PLANILHA: ${planVendas}`);
    }
}
runFullAudit().catch(console.error);
