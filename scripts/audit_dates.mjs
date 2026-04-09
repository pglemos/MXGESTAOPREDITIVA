import XLSX from 'xlsx';
const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
const datasPlanilha = [...new Set(baseOficial.map(r => r['DATA']))].sort();
console.log('Datas na Planilha:', datasPlanilha.slice(0, 5), '...', datasPlanilha.slice(-5));
