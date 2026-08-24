export type BillboardRepository = {
  name: string;
  url: string;
  summary: string;
};

export type BillboardStory = {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
};

export type BillboardEdition = {
  generatedAt: string;
  github: {
    windowHours: 72;
    summary: string;
    repositories: readonly BillboardRepository[];
  };
  stories: readonly BillboardStory[];
};

export const FALLBACK_BILLBOARD: BillboardEdition = {
  generatedAt: "1970-01-01T00:00:00.000Z",
  github: {
    windowHours: 72,
    summary: "Daily GitHub and technology feed awaiting its first dispatch.",
    repositories: [],
  },
  stories: [],
};

const MAX_SUMMARY_LENGTH = 240;
const MAX_REPOSITORIES = 8;
const MAX_HEADLINE_WORDS = 9;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isHttpsUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function hasValidTimestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function isBillboardEdition(value: unknown, requireCompleteStories = true): value is BillboardEdition {
  if (!isRecord(value) || !hasValidTimestamp(value.generatedAt) || !isRecord(value.github)) return false;
  if (value.github.windowHours !== 72 || !isNonEmptyString(value.github.summary, MAX_SUMMARY_LENGTH)) return false;
  if (!Array.isArray(value.github.repositories) || value.github.repositories.length > MAX_REPOSITORIES) return false;

  for (const repository of value.github.repositories) {
    if (!isRecord(repository)) return false;
    if (!isNonEmptyString(repository.name, 100) || !isHttpsUrl(repository.url) || !isNonEmptyString(repository.summary, 180)) return false;
  }

  if (!Array.isArray(value.stories)) return false;
  if (requireCompleteStories ? value.stories.length !== 5 : value.stories.length > 5) return false;
  for (const story of value.stories) {
    if (!isRecord(story)) return false;
    if (!isNonEmptyString(story.headline, 80) || story.headline.trim().split(/\s+/).length > MAX_HEADLINE_WORDS) return false;
    if (!isNonEmptyString(story.source, 80) || !isHttpsUrl(story.url) || !hasValidTimestamp(story.publishedAt)) return false;
  }

  return true;
}
