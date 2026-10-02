import { expect, test } from "bun:test";

import { safeNextPath } from "../lib/safe-next-path";

test("keeps internal callback destinations", () => {
  expect(safeNextPath("/notebooks/123?tab=chat")).toBe("/notebooks/123?tab=chat");
});

test("rejects external and protocol-relative callback destinations", () => {
  for (const path of ["https://example.com", "//example.com", "/\\example.com", "javascript:alert(1)", null]) {
    expect(safeNextPath(path)).toBe("/");
  }
});
