import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { FALLBACK_BILLBOARD, isBillboardEdition, type BillboardEdition } from "../app/data/billboard.ts";

const validEdition: BillboardEdition = {
  generatedAt: new Date().toISOString(),
  github: {
    windowHours: 72,
    summary: "Librebox-VM: 3 commits",
    repositories: [{ name: "Librebox-VM", url: "https://github.com/abharrison1995-droid/Librebox-VM", summary: "3 commits" }],
  },
  stories: Array.from({ length: 5 }, (_, index) => ({
    headline: `Major technology story number ${index + 1}`,
    source: "Example News",
    url: `https://example.com/story-${index + 1}`,
    publishedAt: new Date().toISOString(),
  })),
};

test("validates complete editions and rejects unsafe or verbose stories", () => {
  assert.equal(isBillboardEdition(validEdition), true);
  assert.equal(isBillboardEdition({ ...validEdition, stories: [] }), false);
  assert.equal(isBillboardEdition({ ...validEdition, stories: validEdition.stories.map((story, index) => index === 0 ? { ...story, url: "http://example.com" } : story) }), false);
  assert.equal(isBillboardEdition({ ...validEdition, stories: validEdition.stories.map((story, index) => index === 0 ? { ...story, headline: "one two three four five six seven eight nine ten" } : story) }), false);
});

test("ships a structurally safe waiting edition", async () => {
  const raw = await readFile(new URL("../public/data/billboard.json", import.meta.url), "utf8");
  assert.deepEqual(JSON.parse(raw), FALLBACK_BILLBOARD);
  assert.equal(isBillboardEdition(JSON.parse(raw), false), true);
});
