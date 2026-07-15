import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "Modal.tsx"), "utf8");

describe("Modal referenceStyle visual contract", () => {
  test("mantém o padding de rodapé de 20px do ModalShell Base44", () => {
    expect(source).toContain(
      'style={referenceStyle ? undefined : {\n                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)",\n              }}',
    );
  });
});
