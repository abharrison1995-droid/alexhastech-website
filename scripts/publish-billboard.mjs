import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GITHUB_USERNAME = "abharrison1995-droid";
const GITHUB_WINDOW_HOURS = 72;

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function eventActivity(event) {
  const payload = event?.payload ?? {};
  switch (event?.type) {
    case "PushEvent": {
      const commitCount = Number(payload.size ?? payload.commits?.length ?? 1);
      return ["commits", Number.isFinite(commitCount) && commitCount > 0 ? commitCount : 1];
    }
    case "PullRequestEvent":
      return [payload.action === "closed" && payload.pull_request?.merged ? "pull requests merged" : "pull request updates", 1];
    case "IssuesEvent":
      return ["issue updates", 1];
    case "ReleaseEvent":
      return ["releases", 1];
    case "CreateEvent":
      return [payload.ref_type === "repository" ? "repositories created" : "branches or tags created", 1];
    default:
      return null;
  }
}

export function summarizeGithubEvents(events, now = new Date()) {
  const cutoff = now.getTime() - GITHUB_WINDOW_HOURS * 60 * 60 * 1000;
  const repositories = new Map();

  for (const event of events) {
    const createdAt = Date.parse(event?.created_at);
    if (!event?.public || !Number.isFinite(createdAt) || createdAt < cutoff || typeof event.repo?.name !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(event.repo.name)) continue;
    const activity = eventActivity(event);
    if (!activity) continue;
    const [label, count] = activity;
    const current = repositories.get(event.repo.name) ?? { count: 0, actions: new Map() };
    current.count += count;
    current.actions.set(label, (current.actions.get(label) ?? 0) + count);
    repositories.set(event.repo.name, current);
  }

  const ranked = [...repositories.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  const details = ranked.map(([name, activity]) => {
    const shortName = name.split("/").at(-1);
    const summary = [...activity.actions.entries()].map(([label, count]) => plural(count, label.replace(/s$/, ""), label)).join(", ");
    return { name: shortName, url: `https://github.com/${name}`, summary };
  });

  if (details.length === 0) {
    return { windowHours: GITHUB_WINDOW_HOURS, summary: "No public GitHub activity in the last 72 hours — system idle.", repositories: [] };
  }

  const segments = details.map((repository) => `${repository.name}: ${repository.summary}`);
  let summary = segments.join(" · ");
  if (summary.length > 240) summary = `${summary.slice(0, 237).trimEnd()}…`;
  return { windowHours: GITHUB_WINDOW_HOURS, summary, repositories: details };
}

function londonDateAndHour(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return { date: `${value("year")}-${value("month")}-${value("day")}`, hour: Number(value("hour")) };
}

export function isScheduledEditionDue(date = new Date(), previousGeneratedAt = null) {
  const current = londonDateAndHour(date);
  if (current.hour < 7) return false;
  if (!previousGeneratedAt || !Number.isFinite(Date.parse(previousGeneratedAt))) return true;
  return londonDateAndHour(new Date(previousGeneratedAt)).date !== current.date;
}

export async function fetchGithubEvents(now = new Date(), fetchImpl = fetch) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "alexhastech-daily-billboard",
    "x-github-api-version": "2022-11-28",
  };
  if (process.env.GITHUB_READ_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_READ_TOKEN}`;
  const cutoff = now.getTime() - GITHUB_WINDOW_HOURS * 60 * 60 * 1000;
  const events = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetchImpl(`https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100&page=${page}`, { headers });
    if (!response.ok) throw new Error(`GitHub activity request failed (${response.status})`);
    const pageEvents = await response.json();
    if (!Array.isArray(pageEvents)) throw new Error("GitHub activity response was not an array");
    events.push(...pageEvents);
    const reachedCutoff = pageEvents.some((event) => {
      const createdAt = Date.parse(event?.created_at);
      return Number.isFinite(createdAt) && createdAt < cutoff;
    });
    if (pageEvents.length < 100 || reachedCutoff) break;
  }
  return events;
}

function extractGeminiText(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new Error("Gemini response did not contain content parts");
  const text = parts.map((part) => part?.text).filter((part) => typeof part === "string").join("").trim();
  if (!text) throw new Error("Gemini response did not contain output text");
  return text;
}

function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const fencedJson = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1];
    if (!fencedJson) throw new Error("Gemini response was not valid JSON");
    return JSON.parse(fencedJson);
  }
}

function normalizedSourceUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function collectGoogleSearchSourceUrls(response) {
  const sources = new Set();
  for (const candidate of response?.candidates ?? []) {
    for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
      const normalized = normalizedSourceUrl(chunk?.web?.uri);
      if (normalized) sources.add(normalized);
    }
  }
  return sources;
}

export function validateStories(value, evidenceUrls, now = new Date()) {
  if (!Array.isArray(value?.stories) || value.stories.length !== 5) throw new Error("News response must contain exactly five stories");
  if (!(evidenceUrls instanceof Set) || evidenceUrls.size === 0) throw new Error("News response did not include web-search evidence");
  const seen = new Set();
  const seenUrls = new Set();
  const latestAllowed = now.getTime() + 15 * 60 * 1000;
  const earliestAllowed = now.getTime() - 24 * 60 * 60 * 1000;
  for (const story of value.stories) {
    if (typeof story.headline !== "string" || story.headline.trim().length === 0 || story.headline.trim().split(/\s+/).length > 9 || story.headline.length > 80) throw new Error("A news headline exceeds the compact headline limit");
    if (typeof story.source !== "string" || story.source.trim().length === 0 || story.source.length > 80) throw new Error("A news source is invalid");
    const sourceUrl = normalizedSourceUrl(story.url);
    if (!sourceUrl || !evidenceUrls.has(sourceUrl)) throw new Error("A story URL is not backed by the response's web-search evidence");
    const publishedAt = Date.parse(story.publishedAt);
    if (!Number.isFinite(publishedAt) || publishedAt < earliestAllowed || publishedAt > latestAllowed) throw new Error("A story falls outside the previous 24-hour news window");
    const fingerprint = story.headline.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(fingerprint)) throw new Error("News response contains duplicate stories");
    if (seenUrls.has(sourceUrl)) throw new Error("News response reuses the same source article");
    seen.add(fingerprint);
    seenUrls.add(sourceUrl);
  }
  return value.stories;
}

async function fetchTechStories(now) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You are the editor of a tiny public technology-news wire. Use Google Search grounding. Select five distinct, consequential technology stories first published or materially updated in the previous 24 hours. Prefer primary reporting and reputable technology publications. Exclude rumours, opinion-only pieces, sponsored content, and duplicate angles on the same event. Headlines must be factual, neutral, and no more than nine words. Each story URL must exactly match a Google Search source you used. Return only valid JSON, with no Markdown, in this shape: {\"stories\":[{\"headline\":\"string\",\"source\":\"string\",\"url\":\"https://...\",\"publishedAt\":\"ISO-8601 timestamp\"}]}" }],
      },
      contents: [{
        role: "user",
        parts: [{ text: `Prepare the edition generated at ${now.toISOString()}. Verify every publication time and use an exact sourced article URL, not a publication home page.` }],
      }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  if (!response.ok) throw new Error(`Gemini news request failed (${response.status}): ${await response.text()}`);
  const payload = await response.json();
  return validateStories(parseJsonResponse(extractGeminiText(payload)), collectGoogleSearchSourceUrls(payload), now);
}

function billboardOutputPath() {
  const defaultOutput = fileURLToPath(new URL("../public/data/billboard.json", import.meta.url));
  return resolve(process.env.BILLBOARD_OUTPUT || defaultOutput);
}

async function writeEdition(edition, outputPath = billboardOutputPath()) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(edition, null, 2)}\n`, "utf8");
}

export async function main() {
  const now = new Date();
  const outputPath = billboardOutputPath();
  if (process.env.GITHUB_EVENT_NAME === "schedule") {
    let previousGeneratedAt = null;
    try {
      previousGeneratedAt = JSON.parse(await readFile(outputPath, "utf8"))?.generatedAt ?? null;
    } catch {
      // A missing or malformed first-launch file should be replaced once 07:00 London has passed.
    }
    if (!isScheduledEditionDue(now, previousGeneratedAt)) {
      console.log("Skipping: today's 07:00 Europe/London edition already exists or is not due yet.");
      return;
    }
  }
  const [events, stories] = await Promise.all([fetchGithubEvents(now), fetchTechStories(now)]);
  const edition = { generatedAt: now.toISOString(), github: summarizeGithubEvents(events, now), stories };
  await writeEdition(edition, outputPath);
  console.log(`Generated the ${edition.generatedAt} billboard edition.`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
