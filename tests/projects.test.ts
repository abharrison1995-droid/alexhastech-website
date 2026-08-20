import assert from "node:assert/strict";
import test from "node:test";
import { assertProjectRegistry, projects } from "../app/data/projects.ts";

test("project registry accepts the declarative portfolio data", () => {
  assert.doesNotThrow(() => assertProjectRegistry(projects));
});

test("project registry rejects invalid layout and featured data", () => {
  assert.throws(() => assertProjectRegistry([{ ...projects[0], desktop: { x: -1, y: 0, width: "large" } }]), /exactly one featured|Invalid desktop/);
  assert.throws(() => assertProjectRegistry([{ ...projects[0], featured: false }]), /exactly one featured/);
});
