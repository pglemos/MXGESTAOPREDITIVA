import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dir, "AgendaD1Panel.tsx"),
  "utf8",
);

describe("AgendaD1Panel visual contract", () => {
  test("mantém os primitives visuais observados no AgendaD1Modal do Base44", () => {
    expect(source).toContain('"rounded-2xl bg-gray-50 p-4 space-y-3"');
    expect(source).toContain('"flex items-center gap-2 text-xs font-semibold text-gray-600"');
    expect(source).toContain('"overflow-x-auto rounded-2xl border border-gray-100"');
    expect(source).toContain('"text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"');
    expect(source).not.toContain('aria-label="Copiar telefone"');
  });
});
