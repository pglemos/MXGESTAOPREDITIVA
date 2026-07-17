#!/usr/bin/env node
// Gera/verifica supabase/migrations/.migration-checksums.json (Fase 4 — congelamento).
//
//   node scripts/gen_migration_checksums.mjs          # regenera o manifest (freeze atual)
//   node scripts/gen_migration_checksums.mjs --check   # CI: falha se migration congelada mudou
//
// Regra: migrations JÁ presentes no manifest são imutáveis (forward-only). Se o
// hash de um arquivo congelado mudar, ou um arquivo congelado sumir, o --check
// falha. Migrations novas (ainda não no manifest) são permitidas e ignoradas
// pelo --check — devem ser congeladas rodando o gerador sem --check.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migDir = join(root, 'supabase', 'migrations');
const manifestPath = join(migDir, '.migration-checksums.json');

function listMigrations() {
  return readdirSync(migDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(join(migDir, file))).digest('hex');
}

const check = process.argv.includes('--check');

if (check) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    console.error('ERRO: .migration-checksums.json ausente. Rode: node scripts/gen_migration_checksums.mjs');
    process.exit(1);
  }
  const frozen = manifest.checksums || {};
  const present = new Set(listMigrations());
  const errors = [];
  for (const [file, hash] of Object.entries(frozen)) {
    if (!present.has(file)) {
      errors.push(`Migration congelada removida/renomeada: ${file}`);
      continue;
    }
    const current = sha256(file);
    if (current !== hash) {
      errors.push(`Migration congelada modificada: ${file}\n  esperado ${hash}\n  atual    ${current}`);
    }
  }
  if (errors.length) {
    console.error('FALHA — histórico de migrations não é forward-only:\n' + errors.join('\n'));
    process.exit(1);
  }
  const novas = listMigrations().filter((f) => !(f in frozen));
  console.log(`OK — ${Object.keys(frozen).length} migrations congeladas íntegras.`);
  if (novas.length) console.log(`(${novas.length} migration(s) nova(s) não congelada(s): ${novas.join(', ')})`);
  process.exit(0);
}

// Regenera manifest (freeze de tudo que existe hoje)
const checksums = {};
for (const f of listMigrations()) checksums[f] = sha256(f);
const out = {
  _comment:
    'Congelamento forward-only das migrations aplicadas. NÃO editar à mão. ' +
    'Regenerar apenas ao adicionar migrations novas: node scripts/gen_migration_checksums.mjs',
  generated_at: new Date().toISOString().slice(0, 10),
  algorithm: 'sha256',
  count: Object.keys(checksums).length,
  checksums,
};
writeFileSync(manifestPath, JSON.stringify(out, null, 2) + '\n');
console.log(`Manifest gravado: ${Object.keys(checksums).length} migrations congeladas.`);
