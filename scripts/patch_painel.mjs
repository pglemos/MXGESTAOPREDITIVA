import fs from 'fs';
let content = fs.readFileSync('src/pages/PainelConsultor.tsx', 'utf8');

// Encontrar o início do bloco fetchNetworkSnapshot que tem o loop de agregação
const startIndex = content.indexOf('// Buscando');
const endIndex = content.indexOf('setDiagnostics(diagnosticsMap)') + 30; // incluindo o setDiagnostics

const newBlock = `
            const { data: aggregatedData, error: aggError } = await supabase.from('view_store_daily_production').select('*')
            if (aggError) throw aggError;

            const salesMap = {};
            (aggregatedData || []).forEach(row => {
                const sid = row.store_id;
                if (!salesMap[sid]) salesMap[sid] = { total: 0, leads: 0, agd: 0, vis: 0 };
                salesMap[sid].total += Number(row.total_vendas || 0);
                salesMap[sid].leads += Number(row.total_leads || 0);
                salesMap[sid].agd += Number(row.total_agendamentos || 0);
                salesMap[sid].vis += Number(row.total_visits || 0);
            });

            const diagnosticsMap = {};
            stores.forEach(store => {
                const s = salesMap[store.id] || { total: 0, leads: 0, agd: 0, vis: 0 };
                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, 
                    sales: s.total, leads: s.leads, agd: s.agd, vis: s.vis,
                    goal: 0, gap: 0, proj: 0, ritmo: 0, efficiency: 0, sellers: 0, checkedInToday: 0, disciplinePct: 100
                };
            });
            setDiagnostics(diagnosticsMap);
`;

content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
fs.writeFileSync('src/pages/PainelConsultor.tsx', content);
