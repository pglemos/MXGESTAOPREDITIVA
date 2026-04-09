import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runGranularAudit() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    console.log('--- AUDITORIA GRANULAR: PLANILHA vs BANCO (Últimos registros) ---');
    
    // Agrupar planilha por loja e vendedor
    const groupedPlan = baseOficial.reduce((acc, row) => {
        const key = `${row['LOJA']}-${row['VENDEDOR']}`;
        if (!acc[key]) acc[key] = { leads: 0, visitas: 0, agd: 0, vnd: 0 };
        acc[key].leads += (row['LEADS'] || 0);
        acc[key].visitas += (row['VISITA'] || 0);
        acc[key].agd += (row['AGD_NET'] || 0);
        acc[key].vnd += (row['VND_NET'] || 0);
        return acc;
    }, {});

    console.log('Dados extraídos da planilha. Comparando com o Banco...');

    const { data: dbData } = await supabase.from('daily_checkins').select('store_id, seller_user_id, leads, visitas, agd_net, vnd_net');

    // Essa comparação exige que store_id e seller_user_id estejam mapeados. 
    // Como os IDs do banco não batem com os nomes da planilha, 
    // vou listar o que o banco tem para compararmos lado a lado.
    
    console.log('Resumo dos dados no Banco de Dados (Totalizador):');
    const dbSummary = dbData.reduce((acc, row) => {
        const key = `${row.store_id}-${row.seller_user_id}`;
        if (!acc[key]) acc[key] = { leads: 0, visitas: 0, agd: 0, vnd: 0 };
        acc[key].leads += row.leads;
        acc[key].visitas += row.visitas;
        acc[key].agd += row.agd_net;
        acc[key].vnd += row.vnd_net;
        return acc;
    }, {});

    console.log('Planilha (Amostra):', Object.keys(groupedPlan).slice(0, 5));
    console.log('Banco (Amostra de chaves ID-ID):', Object.keys(dbSummary).slice(0, 5));
}
runGranularAudit().catch(console.error);
