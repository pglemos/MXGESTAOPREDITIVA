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
  let baseSha;
  try {
    baseSha = execSync('git rev-parse --verify origin/main^{commit}', { encoding: 'utf8' }).trim();
  } catch {
    console.error('❌ Não foi possível resolver origin/main para validar migrations alteradas.');
    process.exit(1);
  }

  const files = new Set(
    execSync(`git diff --name-only ${baseSha}...HEAD -- "supabase/migrations/*.sql"`, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean),
  );
  const commands = [
    'git diff --name-only --cached -- "supabase/migrations/*.sql"',
    'git diff --name-only -- "supabase/migrations/*.sql"',
    'git ls-files --others --exclude-standard -- "supabase/migrations/*.sql"',
  ];

  for (const command of commands) {
    try {
      const out = execSync(command, { encoding: 'utf8' });
      out.split('\n').filter(Boolean).forEach(file => files.add(file));
    } catch {
      // Índice/worktree sem alterações não invalida as demais fontes.
    }
  }

  return [...files]
    .filter(p => !p.includes(`/${TEMPLATES_DIR}/`) && !p.includes(`/${ARCHIVED_DIR}/`));
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
