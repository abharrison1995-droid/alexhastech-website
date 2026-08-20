import assert from "node:assert/strict";
import test from "node:test";
import { assertProjectRegistry, projects } from "../app/data/projects.ts";

test("project registry accepts the declarative portfolio data", () => {
  assert.doesNotThrow(() => assertProjectRegistry(projects));
});

test("project registry rejects invalid featured and content data", () => {
  assert.throws(() => assertProjectRegistry([{ ...projects[0], featured: false }]), /exactly one featured/);
  assert.throws(() => assertProjectRegistry([{ ...projects[0], summary: "  " }]), /Incomplete project detail/);
});
