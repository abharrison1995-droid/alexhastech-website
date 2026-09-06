import assert from "node:assert/strict";
import test from "node:test";
import { collectGoogleSearchSourceUrls, fetchGithubEvents, isScheduledEditionDue, summarizeGithubEvents, validateStories } from "../scripts/publish-billboard.mjs";

test("summarizes only public recent GitHub activity", () => {
  const now = new Date("2026-08-24T06:30:00.000Z");
  const summary = summarizeGithubEvents([
    { type: "PushEvent", public: true, created_at: "2026-08-23T10:00:00.000Z", repo: { name: "abharrison1995-droid/Librebox-VM" }, payload: { size: 3 } },
    { type: "IssuesEvent", public: true, created_at: "2026-08-22T10:00:00.000Z", repo: { name: "abharrison1995-droid/Librebox-VM" }, payload: {} },
    { type: "PushEvent", public: false, created_at: "2026-08-23T10:00:00.000Z", repo: { name: "private/secret" }, payload: { size: 99 } },
    { type: "PushEvent", public: true, created_at: "2026-08-01T10:00:00.000Z", repo: { name: "old/repo" }, payload: { size: 2 } },
    { type: "PushEvent", public: true, created_at: "not-a-date", repo: { name: "malformed/date" }, payload: { size: 2 } },
  ], now);
  assert.equal(summary.repositories.length, 1);
  assert.equal(summary.repositories[0].name, "Librebox-VM");
  assert.match(summary.summary, /3 commits/);
  assert.doesNotMatch(summary.summary, /secret|old|malformed/);
});

test("keeps one daily dispatch after 07:00 Europe/London across delays and daylight saving", () => {
  assert.equal(isScheduledEditionDue(new Date("2026-08-24T06:30:00.000Z")), true);
  assert.equal(isScheduledEditionDue(new Date("2026-01-24T06:30:00.000Z")), false);
  assert.equal(isScheduledEditionDue(new Date("2026-01-24T07:30:00.000Z")), true);
  assert.equal(isScheduledEditionDue(new Date("2026-01-24T10:30:00.000Z"), "2026-01-23T07:30:00.000Z"), true);
  assert.equal(isScheduledEditionDue(new Date("2026-01-24T10:30:00.000Z"), "2026-01-24T07:30:00.000Z"), false);
});

test("paginates GitHub events until it passes the 72-hour cutoff", async () => {
  const now = new Date("2026-08-24T06:30:00.000Z");
  const requests = [];
  const recentPage = Array.from({ length: 100 }, (_, index) => ({ id: `recent-${index}`, created_at: "2026-08-23T06:30:00.000Z" }));
  const olderPage = [{ id: "older", created_at: "2026-08-20T06:30:00.000Z" }];
  const fakeFetch = async (url) => {
    requests.push(url);
    return new Response(JSON.stringify(requests.length === 1 ? recentPage : olderPage));
  };
  const events = await fetchGithubEvents(now, fakeFetch);
  assert.equal(requests.length, 2);
  assert.equal(events.length, 101);
});

test("requires every fresh technology story URL to come from Google Search grounding", () => {
  const now = new Date("2026-08-24T06:30:00.000Z");
  const stories = Array.from({ length: 5 }, (_, index) => ({
    headline: `Technology update number ${index + 1}`,
    source: "Example News",
    url: `https://news.example/story-${index + 1}`,
    publishedAt: "2026-08-24T05:00:00.000Z",
  }));
  const response = {
    candidates: [{
      groundingMetadata: {
        groundingChunks: stories.map((story) => ({ web: { uri: story.url } })),
      },
    }],
  };
  const evidence = collectGoogleSearchSourceUrls(response);
  assert.deepEqual(validateStories({ stories }, evidence, now), stories);
  assert.throws(() => validateStories({ stories: stories.map((story, index) => index === 0 ? { ...story, url: "https://fabricated.example/story" } : story) }, evidence, now), /evidence/);
  assert.throws(() => validateStories({ stories: stories.map((story, index) => index === 0 ? { ...story, publishedAt: "2026-08-22T05:00:00.000Z" } : story) }, evidence, now), /24-hour/);
});
