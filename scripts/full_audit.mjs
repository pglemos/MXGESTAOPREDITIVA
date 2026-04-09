import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function runFullAudit() {
    // XLSX pode ser carregado de outra forma se a exportação for diferente
    // Tentando o import como objeto
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    console.log('--- AUDITORIA DE LOJAS (VENDAS) ---');
    const stores = ['PAAY MOTORS', 'SEMINOVOS BHZ', 'ACERTTCAR', 'RK2 MOTORS', 'GANDINI AUTOMOVEIS', 'ESPINDOLA AUTOMOVEIS', 'DNA VEICULOS', 'BROTHERS CAR', 'LIAL VEICULOS', 'PISCAR VEICULOS'];
    
    for (const store of stores) {
        const planVendas = baseOficial.filter(r => r['LOJA'] && r['LOJA'].toUpperCase() === store).reduce((acc, r) => acc + (r['VND_NET'] || 0), 0);
        console.log(`LOJA: ${store.padEnd(25)} | TOTAL VENDAS PLANILHA: ${planVendas}`);
    }

    console.log('\n--- AUDITORIA DE VENDEDORES (LISTAGEM) ---');
    const vendedoresPlanilha = [...new Set(baseOficial.map(r => r['VENDEDOR']))];
    vendedoresPlanilha.forEach(v => console.log(`VENDEDOR: ${v}`));
}
runFullAudit().catch(console.error);
