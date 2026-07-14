import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dir, "LeadConferenceModal.tsx"),
  "utf8",
);

describe("LeadConferenceModal visual contract", () => {
  test("usa o tom verde Base44 para diferença zerada ou ainda indisponível", () => {
    expect(source).toContain('tone={summary.totalDifference === null || summary.totalDifference === 0 ? "green" : "orange"}');
  });
});
