const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
const configData = XLSX.utils.sheet_to_json(workbook.Sheets['CONFIG']);

console.log('-- Migration SQL');
configData.forEach(row => {
    const name = row['NOME DA LOJA'].replace(/'/g, "''");
    const goal = row['META'];
    console.log(`INSERT INTO public.stores (name, manager_email, active) VALUES ('${name}', 'migration@mx.com', true) ON CONFLICT (name) DO NOTHING;`);
});
