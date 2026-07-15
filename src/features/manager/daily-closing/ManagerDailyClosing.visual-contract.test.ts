import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dir, "ManagerDailyClosing.container.tsx"),
  "utf8",
);

describe("ManagerDailyClosing visual contract", () => {
  test("reproduz os primitives literais da página FechamentoEquipe do Base44", () => {
    expect(source).toContain(
      '"bg-white rounded-[16px] border border-gray-100 shadow-sm p-5"',
    );
    expect(source).toContain('"bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden"');
    expect(source).toContain('"bg-gray-50"');
    expect(source).toContain('"divide-y divide-gray-100"');
    expect(source).toContain('"inline-flex h-[38px] items-center gap-1 rounded-[12px] bg-emerald-600');
    expect(source).toContain('className="px-2.5 py-1 rounded-full text-xs font-semibold opacity-0"');
    expect(source).not.toContain("border-slate-100");
    expect(source).not.toContain("text-slate-");
    expect(source).not.toContain("bg-slate-");
    expect(source).not.toContain("rounded-2xl");
  });
});
