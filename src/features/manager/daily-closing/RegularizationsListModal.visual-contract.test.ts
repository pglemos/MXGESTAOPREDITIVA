import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "RegularizationsListModal.tsx"), "utf8");

describe("RegularizationsListModal visual contract", () => {
  test("replica o ModalShell Base44 compacto e seus cards de decisão", () => {
    expect(source).toContain('className="sm:!max-w-2xl"');
    expect(source).toContain('className="rounded-[12px] bg-gray-50 p-4"');
    expect(source).toContain('className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[12px] bg-emerald-600');
    expect(source).toContain('className="h-9 rounded-[12px] border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"');
    expect(source).toContain('rows={2}');
    expect(source).not.toContain('min-h-[80px]');
  });
});
