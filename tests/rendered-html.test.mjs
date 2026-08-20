import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the first portfolio visual slice", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Project Portfolio \| GBH England<\/title>/i);
  assert.match(html, /Skip to featured project/);
  assert.match(html, /<header[^>]*>/i);
  assert.match(html, /<nav[^>]*aria-label="Primary navigation"/i);
  assert.match(html, /id="project-stage"/);
  assert.match(html, /Project stage/);
  assert.match(html, /GBH England/);
  assert.match(html, /In development/);
  assert.match(html, /Portfolio status/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("server-renders each project with distinct truthful content", async () => {
  for (const [path, title, status] of [
    ["/projects/gbh-england", "GBH England", "In development"],
    ["/projects/comptia-revision-suite", "CompTIA A+ revision suite", "Released"],
    ["/projects/thinkpad-mod-loader", "Libreboot/Coreboot ThinkPad mod-loader utility", "Active"],
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(title));
    assert.ok(html.includes(status));
  }
  const utility = await (await render("/projects/thinkpad-mod-loader")).text();
  assert.match(utility, /<h2>Safety and support<\/h2>/);
  assert.match(utility, /Do not treat this page as compatibility or installation guidance/);
  const gbhEngland = await (await render("/projects/gbh-england")).text();
  const comptia = await (await render("/projects/comptia-revision-suite")).text();
  assert.match(gbhEngland, /<h2>Current status<\/h2>/);
  assert.match(comptia, /<h2>Current status<\/h2>/);
  assert.match(gbhEngland, /<img[^>]*\/projects\/gbh-england\/01\.png/);
  assert.match(gbhEngland, /<h2>Gallery<\/h2>/);
  assert.match(comptia, /<img[^>]*\/projects\/comptia-revision-suite\/01\.png/);
  assert.match(comptia, /<h2>Gallery<\/h2>/);
});

test("returns a 404 for an unknown project", async () => {
  const response = await render("/projects/unknown-project");
  assert.equal(response.status, 404);
});
