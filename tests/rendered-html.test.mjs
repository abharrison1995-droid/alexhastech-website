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

test("server-renders the desktop shell with its taskbar and windows", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>alex_has_tech<\/title>/i);
  assert.match(html, /Skip to projects/);
  assert.match(html, /class="desktop-title">alex_has_tech<\/h1>/);
  assert.match(html, /<div class="taskbar" role="toolbar" aria-label="Open programs">/);
  for (const label of ["Projects completed", "Projects in progress", "Get to know"]) {
    assert.ok(html.includes(label), `taskbar is missing ${label}`);
  }
  assert.match(html, /Summon ChatGPT(?:'|&#x27;|&#39;)s Grandad/);
  // Windows ship closed but server-rendered, so tile content stays in the HTML.
  for (const id of ["projects-completed", "projects-in-progress", "chatgpt-grandad", "get-to-know"]) {
    assert.ok(html.includes(`id="window-${id}"`), `missing window ${id}`);
  }
  assert.match(html, /Clippy/);
  assert.match(html, /class="tile-grid"/);
  assert.match(html, /GBH England/);
  assert.match(html, /In development/);
  assert.doesNotMatch(html, /Primary navigation/);
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
  assert.match(utility, /<img[^>]*\/projects\/thinkpad-mod-loader\/01\.jpg/);
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
