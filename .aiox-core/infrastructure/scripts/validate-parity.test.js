const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { getEnabledIdeSet } = require('./validate-parity');

test('seleciona apenas IDEs habilitadas no core-config', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aiox-parity-'));
  fs.mkdirSync(path.join(root, '.aiox-core'));
  fs.writeFileSync(path.join(root, '.aiox-core', 'core-config.yaml'), [
    'ide:',
    '  configs:',
    '    codex: true',
    '    claude-code: true',
    '    gemini: false',
    '    cursor: false',
  ].join('\n'));

  assert.deepEqual([...getEnabledIdeSet(root)].sort(), ['claude-code', 'codex']);
});
