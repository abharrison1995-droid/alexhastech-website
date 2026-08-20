import assert from "node:assert/strict";
import test from "node:test";
import { isStoredLayout } from "../app/lib/desktop-layout.ts";

const slugs = ["one", "two"];

test("stored layouts require exactly the known finite coordinate keys", () => {
  assert.equal(isStoredLayout({ one: { x: 1, y: 2 }, two: { x: 3, y: 4 } }, slugs), true);
  assert.equal(isStoredLayout({ one: { x: 1, y: 2 } }, slugs), false);
  assert.equal(isStoredLayout({ one: { x: 1, y: 2 }, two: { x: Infinity, y: 4 } }, slugs), false);
  assert.equal(isStoredLayout({ one: { x: 1, y: 2 }, two: { x: 3, y: 4 }, stale: { x: 0, y: 0 } }, slugs), false);
});
