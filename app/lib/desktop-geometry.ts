export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = Point & Size;

export const CLEARANCE = 8;

export function clampRect(rect: Rect, bounds: Size): Rect {
  return {
    ...rect,
    x: Math.max(0, Math.min(rect.x, Math.max(0, bounds.width - rect.width))),
    y: Math.max(0, Math.min(rect.y, Math.max(0, bounds.height - rect.height))),
  };
}

export function intersects(a: Rect, b: Rect, clearance = CLEARANCE) {
  return a.x < b.x + b.width + clearance && a.x + a.width + clearance > b.x && a.y < b.y + b.height + clearance && a.y + a.height + clearance > b.y;
}

export function isLegal(rect: Rect, bounds: Size, others: Rect[]) {
  const clamped = clampRect(rect, bounds);
  return rect.width <= bounds.width && rect.height <= bounds.height && clamped.x === rect.x && clamped.y === rect.y && !others.some((other) => intersects(rect, other));
}

export function resolveMove(current: Rect, proposed: Point, bounds: Size, others: Rect[]): Point {
  const xFirst = clampRect({ ...current, x: proposed.x }, bounds);
  let legalX = xFirst.x;
  for (const other of others) {
    const verticallyAligned = current.y < other.y + other.height + CLEARANCE && current.y + current.height + CLEARANCE > other.y;
    if (!verticallyAligned) continue;
    if (xFirst.x > current.x && other.x >= current.x + current.width && xFirst.x + current.width + CLEARANCE > other.x) legalX = Math.min(legalX, other.x - current.width - CLEARANCE);
    if (xFirst.x < current.x && other.x + other.width <= current.x && xFirst.x < other.x + other.width + CLEARANCE) legalX = Math.max(legalX, other.x + other.width + CLEARANCE);
  }
  const yNext = clampRect({ ...current, x: legalX, y: proposed.y }, bounds);
  let legalY = yNext.y;
  for (const other of others) {
    const horizontallyAligned = legalX < other.x + other.width + CLEARANCE && legalX + current.width + CLEARANCE > other.x;
    if (!horizontallyAligned) continue;
    if (yNext.y > current.y && other.y >= current.y + current.height && yNext.y + current.height + CLEARANCE > other.y) legalY = Math.min(legalY, other.y - current.height - CLEARANCE);
    if (yNext.y < current.y && other.y + other.height <= current.y && yNext.y < other.y + other.height + CLEARANCE) legalY = Math.max(legalY, other.y + other.height + CLEARANCE);
  }
  const candidate = { x: legalX, y: legalY };
  const dx = candidate.x - current.x, dy = candidate.y - current.y;
  let firstHit = 1;
  for (const other of others) {
    const left = other.x - current.width - CLEARANCE, right = other.x + other.width + CLEARANCE;
    const top = other.y - current.height - CLEARANCE, bottom = other.y + other.height + CLEARANCE;
    // A stationary axis only overlaps a swept slab when it is already inside it.
    // Treating every stationary axis as (-∞, ∞) makes a remote obstacle block a
    // purely horizontal or vertical move.
    if (dx === 0 && (current.x <= left || current.x >= right)) continue;
    if (dy === 0 && (current.y <= top || current.y >= bottom)) continue;
    const tx1 = dx === 0 ? -Infinity : (left - current.x) / dx;
    const tx2 = dx === 0 ? Infinity : (right - current.x) / dx;
    const ty1 = dy === 0 ? -Infinity : (top - current.y) / dy;
    const ty2 = dy === 0 ? Infinity : (bottom - current.y) / dy;
    const entry = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2));
    const exit = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
    if (entry >= 0 && entry <= exit && entry < firstHit && entry <= 1) firstHit = entry;
  }
  if (firstHit < 1) return { x: current.x + dx * Math.max(0, firstHit - 0.0001), y: current.y + dy * Math.max(0, firstHit - 0.0001) };
  return candidate;
}

export function snapMove(rect: Rect, bounds: Size, others: Rect[], distance = 8): Point {
  const candidates = [
    { x: 0, y: rect.y, close: Math.abs(rect.x) <= distance },
    { x: bounds.width - rect.width, y: rect.y, close: Math.abs(bounds.width - rect.width - rect.x) <= distance },
    { x: rect.x, y: 0, close: Math.abs(rect.y) <= distance },
    { x: rect.x, y: bounds.height - rect.height, close: Math.abs(bounds.height - rect.height - rect.y) <= distance },
  ].filter((candidate) => candidate.close);
  for (const candidate of candidates) {
    const next = { ...rect, x: candidate.x, y: candidate.y };
    if (isLegal(next, bounds, others)) return { x: candidate.x, y: candidate.y };
  }
  return { x: rect.x, y: rect.y };
}
