import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const script = path.resolve('scripts/validate_mx_v3.js');

function csvField(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

test('preserva campos CSV quoted, vazios e multilinha', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mx-v3-csv-'));
  const input = path.join(root, 'manifest.csv');
  const output = path.join(root, 'checklist.csv');
  const records = path.join(root, 'records.json');
  const rows = [
    ['id', 'perfil', 'breakpoint', 'rota', 'estado', 'arquivo', 'hash', 'status', 'mensagem'],
    ['1', 'VENDEDOR', 'Desktop', '/rota', 'PADRAO', 'Desktop_VENDEDOR_01.png', 'a'.repeat(64), 'CAPTURADO', 'texto, com vírgula'],
    ['2', 'GERENTE', 'Mobile', '/ação', 'PADRAO', 'Mobile_GERENTE_01.png', 'b'.repeat(64), 'CAPTURADO', 'linha um\nlinha "dois"'],
    ['3', 'DONO', 'Tablet', '/vazio', 'PADRAO', 'Tablet_DONO_01.png', 'c'.repeat(64), 'CAPTURADO', ''],
    ['4', 'ADMIN', 'Notebook', '/café', 'PADRAO', 'Notebook_ADMIN_01.png', 'd'.repeat(64), 'CAPTURADO', 'ação ✓'],
  ];
  fs.writeFileSync(input, `${rows.map((row) => row.map(csvField).join(',')).join('\n')}\n`);

  execFileSync('node', [script, '--input', input, '--output', output, '--records-json', records], {
    cwd: path.resolve('.'),
    stdio: 'pipe',
  });

  const parsed = JSON.parse(fs.readFileSync(records, 'utf8'));
  assert.deepEqual(parsed.map((record) => record.mensagem), [
    'texto, com vírgula',
    'linha um\nlinha "dois"',
    '',
    'ação ✓',
  ]);
  assert.equal(fs.readFileSync(output, 'utf8').trim().split('\n').length, 5);
});
