import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('propaga falha de compactação para resultar em saída não-zero', () => {
  const source = fs.readFileSync(new URL('./review_visual_v3.js', import.meta.url), 'utf8');
  assert.match(
    source,
    /log\(`Falha ao gerar ZIP: \$\{error\.message\}`\);\s*throw error;/,
  );
});
