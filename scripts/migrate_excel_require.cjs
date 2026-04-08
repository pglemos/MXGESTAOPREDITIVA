const XLSX = require('xlsx');
const path = require('path');

const filePath = '/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx';
const workbook = XLSX.readFile(filePath);
const sheetNames = workbook.SheetNames;
console.log('Sheets found:', sheetNames);

// Dump all data for inspection
sheetNames.forEach(name => {
    console.log(`--- Sheet: ${name} ---`);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
});
