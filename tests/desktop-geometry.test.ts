import assert from "node:assert/strict";
import test from "node:test";
import { clampRect, intersects, isLegal, resolveMove, snapMove } from "../app/lib/desktop-geometry.ts";

test("clamps windows to desktop bounds", () => {
  assert.deepEqual(clampRect({ x: -2, y: 99, width: 40, height: 40 }, { width: 100, height: 100 }), { x: 0, y: 60, width: 40, height: 40 });
});

test("rejects a window larger than the desktop", () => {
  assert.equal(isLegal({ x: 0, y: 0, width: 101, height: 40 }, { width: 100, height: 100 }, []), false);
});

test("permits placement flush with the coordinate container's right and bottom edges", () => {
  const bounds = { width: 400, height: 300 };
  const rect = { x: 280, y: 210, width: 120, height: 90 };
  assert.equal(isLegal(rect, bounds, []), true);
  assert.deepEqual(resolveMove({ x: 0, y: 0, width: 120, height: 90 }, { x: 999, y: 999 }, bounds, []), { x: 280, y: 210 });
});

test("maintains clearance and resolves movement by axis", () => {
  const moving = { x: 0, y: 0, width: 40, height: 40 };
  const obstacle = { x: 55, y: 0, width: 40, height: 40 };
  assert.equal(intersects(moving, obstacle), false);
  assert.equal(isLegal({ ...moving, x: 10 }, { width: 200, height: 100 }, [obstacle]), false);
  assert.deepEqual(resolveMove(moving, { x: 20, y: 30 }, { width: 200, height: 100 }, [obstacle]), { x: 7, y: 30 });
});

test("cannot tunnel through an obstacle with a fast horizontal or vertical move", () => {
  const moving = { x: 0, y: 0, width: 40, height: 40 };
  assert.deepEqual(resolveMove(moving, { x: 180, y: 0 }, { width: 240, height: 240 }, [{ x: 90, y: 0, width: 40, height: 40 }]), { x: 42, y: 0 });
  assert.deepEqual(resolveMove(moving, { x: 0, y: 180 }, { width: 240, height: 240 }, [{ x: 0, y: 90, width: 40, height: 40 }]), { x: 0, y: 42 });
});

test("remote obstacles do not block a move on a stationary axis", () => {
  const moving = { x: 0, y: 0, width: 40, height: 40 };
  assert.deepEqual(resolveMove(moving, { x: 180, y: 0 }, { width: 240, height: 240 }, [{ x: 90, y: 100, width: 40, height: 40 }]), { x: 180, y: 0 });
  assert.deepEqual(resolveMove(moving, { x: 0, y: 180 }, { width: 240, height: 240 }, [{ x: 100, y: 90, width: 40, height: 40 }]), { x: 0, y: 180 });
});

test("prevents diagonal tunnelling while allowing a near miss", () => {
  const moving = { x: 0, y: 0, width: 20, height: 20 };
  const blocked = resolveMove(moving, { x: 180, y: 180 }, { width: 240, height: 240 }, [{ x: 90, y: 90, width: 30, height: 30 }]);
  assert.ok(blocked.x < 62 && blocked.y < 62);
  assert.deepEqual(resolveMove(moving, { x: 180, y: 40 }, { width: 240, height: 240 }, [{ x: 90, y: 90, width: 30, height: 30 }]), { x: 180, y: 40 });
});

test("snaps only to a legal edge", () => {
  assert.deepEqual(snapMove({ x: 5, y: 30, width: 40, height: 40 }, { width: 120, height: 100 }, []), { x: 0, y: 30 });
  assert.deepEqual(snapMove({ x: 5, y: 30, width: 40, height: 40 }, { width: 120, height: 100 }, [{ x: 0, y: 30, width: 40, height: 40 }]), { x: 5, y: 30 });
});
