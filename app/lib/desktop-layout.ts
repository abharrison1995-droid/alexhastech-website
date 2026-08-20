import type { Point } from "./desktop-geometry";

export type Layout = Record<string, Point>;

export function isStoredLayout(value: unknown, slugs: readonly string[]): value is Layout {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const layout = value as Record<string, unknown>;
  return Object.keys(layout).length === slugs.length && slugs.every((slug) => {
    const point = layout[slug];
    return !!point && typeof point === "object" && Number.isFinite((point as Point).x) && Number.isFinite((point as Point).y);
  });
}
