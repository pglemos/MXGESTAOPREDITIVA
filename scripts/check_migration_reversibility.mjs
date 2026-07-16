#!/usr/bin/env node
// Story 0.7 — Lint para garantir bloco DOWN em migrations
// Uso: node scripts/check_migration_reversibility.mjs [--changed-only]
// Exit codes: 0 = ok, 1 = falha (migration sem DOWN)

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { basename, join } from 'node:path';

const MIGRATIONS_DIR = 'supabase/migrations';
const ROLLBACKS_DIR = 'supabase/rollbacks';
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

function rollbackCompanionFor(file) {
  return join(ROLLBACKS_DIR, basename(file));
}

function hasExecutableRollbackCompanion(file) {
  const companion = rollbackCompanionFor(file);
  if (!existsSync(companion)) return false;

  const content = readFileSync(companion, 'utf8');
  return hasDownBlock(content) && /\b(?:DROP|ALTER|REVOKE|GRANT|DELETE|UPDATE)\b/i.test(content);
}

const files = onlyChanged ? listChangedMigrations() : listMigrations();

if (files.length === 0) {
  console.log('Nenhuma migration para validar.');
  process.exit(0);
}

const failures = [];
const companionRollbacks = [];
for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch (err) {
    // arquivo pode ter sido deletado no diff
    if (err.code === 'ENOENT') continue;
    throw err;
  }

  if (hasDownBlock(content)) continue;
  if (hasExecutableRollbackCompanion(file)) {
    companionRollbacks.push(rollbackCompanionFor(file));
    continue;
  }
  failures.push(file);
}

if (failures.length > 0) {
  console.error('❌ Migrations sem rollback documentado ou executável:');
  failures.forEach(f => console.error(`   - ${f}`));
  console.error('');
  console.error('Adicione um bloco "-- DOWN" na migration ou um rollback executável em:');
  failures.forEach(f => console.error(`   - ${rollbackCompanionFor(f)}`));
  process.exit(1);
}

if (companionRollbacks.length > 0) {
  console.log(`↩️  ${companionRollbacks.length} rollback(s) executável(is) validado(s) em ${ROLLBACKS_DIR}.`);
}
console.log(`✅ Todas as ${files.length} migration${files.length === 1 ? '' : 's'} têm rollback documentado.`);
process.exit(0);
