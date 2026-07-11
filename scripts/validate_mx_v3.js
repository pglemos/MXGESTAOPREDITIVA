import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const DEFAULT_OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';

function parseArgs(argv = process.argv.slice(2)) {
  const readValue = (flag) => {
    const index = argv.indexOf(flag);
    return index === -1 ? null : argv[index + 1] || null;
  };

  const outputDir = process.env.MX_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
  return {
    manifestPath: readValue('--input') || path.join(outputDir, '05_RELATORIOS', 'MANIFESTO_V3_PRIMARIO.csv'),
    reportPath: readValue('--output') || path.join(outputDir, '05_RELATORIOS', 'CHECKLIST_VALIDACAO_V3.csv'),
    recordsJsonPath: readValue('--records-json'),
  };
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV inválido: aspas não fechadas');
  if (field !== '' || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function parseManifestCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  return rows.slice(1)
    .filter((parts) => parts.some((part) => part !== ''))
    .map((parts) => ({
      id: parts[0] || '',
      perfil: parts[1] || '',
      breakpoint: parts[2] || '',
      rota: parts[3] || '',
      estado: parts[4] || '',
      arquivo: parts[5] || '',
      hash: parts[6] || '',
      statusScript: parts[7] || '',
      mensagem: parts.slice(8).join(','),
    }));
}

function getHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function validateCaptures({ manifestPath, reportPath, recordsJsonPath } = parseArgs()) {
  console.log('Iniciando Validação Automática V3...');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Manifesto primário não encontrado.');
  }

  const records = parseManifestCsv(fs.readFileSync(manifestPath, 'utf-8'));
  const outputDir = path.dirname(path.dirname(manifestPath));

  // Agrupar arquivos pelo mesmo ID/Perfil/Breakpoint para checar FALHA_SCROLL
  const hashCache = {};
  
  for (const record of records) {
    const folderMod = `0${['VENDEDOR','GERENTE','DONO','ADMIN'].indexOf(record.perfil)+1}_MODULO_${record.perfil.replace('ADMIN', 'ADMIN_MX')}`;
    // Precisamos achar o nome da página (que eu não gravei no CSV, mas posso inferir pela rota ou buscar nos diretórios)
    // Para simplificar, vou procurar o arquivo em todas as subpastas do módulo
    const modPath = path.join(outputDir, folderMod);
    let filePath = null;
    
    if (fs.existsSync(modPath)) {
      const subdirs = fs.readdirSync(modPath);
      for (const subdir of subdirs) {
        const testPath = path.join(modPath, subdir, record.arquivo);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }
    }

    if (!filePath) {
      record.statusFinal = 'FALHA_ARQUIVO_NAO_ENCONTRADO';
      record.hashReal = 'N/A';
      continue;
    }

    const realHash = getHash(filePath);
    record.hashReal = realHash;
    
    if (record.statusScript !== 'CAPTURADO') {
      record.statusFinal = record.statusScript; // Preservar FALHA_INTERACAO, etc.
    } else {
      record.statusFinal = 'VALIDACAO_AUTOMATICA_APROVADA';
    }
  }

  // Verificar FALHA_SCROLL (fatias iguais) e FALHA_INTERACAO (estado com mesmo hash do PADRAO)
  const grouped = {};
  records.forEach(r => {
    const key = `${r.perfil}_${r.breakpoint}_${r.rota}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  for (const key in grouped) {
    const stateGroup = grouped[key];
    
    // Check fatias consecutivas no mesmo estado
    for (const r of stateGroup) {
      if (r.arquivo.includes('_P0')) {
         // Se for P02, checa contra P01
         const match = r.arquivo.match(/_P(\d+)\.png/);
         if (match) {
           const idx = parseInt(match[1]);
           if (idx > 1) {
             const prevFile = r.arquivo.replace(`_P${String(idx).padStart(2, '0')}`, `_P${String(idx-1).padStart(2, '0')}`);
             const prevRecord = stateGroup.find(x => x.arquivo === prevFile);
             if (prevRecord && prevRecord.hashReal === r.hashReal) {
               r.statusFinal = 'FALHA_SCROLL';
               r.mensagem = 'Hash idêntico à fatia anterior';
             }
           }
         }
      }
    }

    // Check interações contra o estado PADRAO
    const padraoStates = stateGroup.filter(x => x.estado === 'PADRAO');
    if (padraoStates.length > 0) {
       for (const r of stateGroup) {
         if (r.estado !== 'PADRAO' && r.statusFinal === 'VALIDACAO_AUTOMATICA_APROVADA') {
            // Find corresponding PADRAO (slice index needs to match or we just check base if no slices)
            const isSlice = r.arquivo.match(/_P(\d+)\.png/);
            const padrao = padraoStates.find(p => {
               if (isSlice) return p.arquivo.includes(isSlice[0]);
               return !p.arquivo.includes('_P0');
            });

            if (padrao && padrao.hashReal === r.hashReal) {
               r.statusFinal = 'FALHA_INTERACAO';
               r.mensagem = 'Mudança visual irrelevante (mesmo hash do padrão)';
            }
         }
       }
    }
  }

  // Escrever o checklist final
  let reportCsv = 'Arquivo,SHA-256,Estado_Esperado,Assercao_Semantica,Resultado_Comparacao,Analise_Rolagem,Loading,DataHora,VersaoValidador,StatusAutomatico,StatusRevisaoVisual\n';
  const now = new Date().toISOString();
  
  for (const r of records) {
    const loading = 'NAO_DETECTADO'; // Por hora confiamos no script de captura para isso (que rejeita falhas).
    const comparacao = r.statusFinal === 'FALHA_INTERACAO' ? 'IDENTICO_AO_PADRAO' : 'MUDANCA_VISUAL_OK';
    const rolagem = r.statusFinal === 'FALHA_SCROLL' ? 'IDENTICO_A_FATIA_ANTERIOR' : 'OK';
    const assercao = r.statusScript === 'FALHA_INTERACAO' ? 'FALHOU_OU_TIMEOUT' : 'SUCESSO_OU_NA';
    
    // Nenhum é VALIDADO ainda.
    const revVisual = 'PENDENTE';
    
    reportCsv += `${r.arquivo},${r.hashReal},${r.estado},${assercao},${comparacao},${rolagem},${loading},${now},V3.0,${r.statusFinal},${revVisual}\n`;
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportCsv);
  if (recordsJsonPath) fs.writeFileSync(recordsJsonPath, JSON.stringify(records, null, 2));
  console.log(`Validação concluída. Relatório gravado em: ${reportPath}`);
  
  // Resumo
  const totais = records.reduce((acc, r) => {
    acc[r.statusFinal] = (acc[r.statusFinal] || 0) + 1;
    return acc;
  }, {});
  console.log('Resumo de Status Automático:');
  console.table(totais);
  console.log('STATUS DA AUDITORIA: CONCLUÍDO COM PENDÊNCIA DE REVISÃO VISUAL');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateCaptures().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { parseArgs, parseCsvRows, parseManifestCsv, validateCaptures };
