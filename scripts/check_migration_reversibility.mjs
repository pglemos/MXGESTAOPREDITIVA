#!/usr/bin/env node
// Story 0.7 — Lint para garantir bloco DOWN em migrations
// Uso: node scripts/check_migration_reversibility.mjs [--changed-only]
// Exit codes: 0 = ok, 1 = falha (migration sem DOWN)

import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const MIGRATIONS_DIR = 'supabase/migrations';
const TEMPLATES_DIR = '_templates';
const ARCHIVED_DIR = '_archived';

// Padrão regex que detecta presença do bloco DOWN comentado
const DOWN_PATTERN = /^--\s*=+\s*$\s*^--\s*DOWN/im;
const DOWN_ALT_PATTERN = /^--\s*DOWN\b/im;

const onlyChanged = process.argv.includes('--changed-only');

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith('.sql'))
    .filter(d => !d.name.startsWith('_'))
    .map(d => join(MIGRATIONS_DIR, d.name));
}

function listChangedMigrations() {
  try {
    const out = execSync('git diff --name-only origin/main...HEAD -- "supabase/migrations/*.sql"', { encoding: 'utf8' });
    return out
      .split('\n')
      .filter(Boolean)
      .filter(p => !p.includes(`/${TEMPLATES_DIR}/`) && !p.includes(`/${ARCHIVED_DIR}/`));
  } catch {
    return [];
  }
}

function hasDownBlock(content) {
  return DOWN_PATTERN.test(content) || DOWN_ALT_PATTERN.test(content);
}

const files = onlyChanged ? listChangedMigrations() : listMigrations();

if (files.length === 0) {
  console.log('Nenhuma migration para validar.');
  process.exit(0);
}

const failures = [];
for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch (err) {
    // arquivo pode ter sido deletado no diff
    if (err.code === 'ENOENT') continue;
    throw err;
  }
  if (!hasDownBlock(content)) {
    failures.push(file);
  }
}

if (failures.length > 0) {
  console.error('❌ Migrations sem bloco DOWN documentado:');
  failures.forEach(f => console.error(`   - ${f}`));
  console.error('');
  console.error('Adicione um bloco "-- DOWN" comentado descrevendo como reverter.');
  console.error('Veja template em supabase/migrations/_templates/template_reversible_migration.sql');
  process.exit(1);
}

console.log(`✅ Todas as ${files.length} migration${files.length === 1 ? '' : 's'} têm bloco DOWN documentado.`);
process.exit(0);
