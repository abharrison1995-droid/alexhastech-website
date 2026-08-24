# alex_has_tech

A software and game portfolio built with React and vinext, presented as a Windows-95 desktop. The page is a teal desktop carrying the `alex_has_tech` wordmark, with a taskbar across the top for project lists, Clippy, and profile information. Clicking one zooms a window out of its taskbar button; project tiles open draggable detail windows without losing their ordinary deep links.

## Projects currently listed

- GBH England — a mobile role-playing game in development.
- CompTIA A+ revision suite — released.
- Libreboot/Coreboot ThinkPad mod-loader utility — active. This site does not publish model support, prerequisites, recovery instructions, downloads, or compatibility claims.

The portfolio includes owner-provided project screenshots (stored under `public/projects/<slug>/`) referenced by each project's `hero` and `gallery` fields. Public links, dates, metrics, and contact details are not yet included; add verified material before publishing.

## Requirements

- Node.js 22.13 or later

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm test
```

`npm test` builds the vinext app and runs rendered-page, project-registry, billboard, and publisher tests. The scripts are compatible with Windows PowerShell.

## Content and interaction

Project records live in `app/data/projects.ts`; a project needs only its content record. Its `status` decides which window it appears in — `Released` goes to Projects completed, anything else to Projects in progress. Selecting a tile opens a draggable project window with its gallery, technology stack, role, and technical notes. The ordinary `/projects/<slug>` route remains available for deep links, search engines, and open-in-new-tab behaviour.

The taskbar windows and project tiles are server-rendered for resilient navigation. Screenshot-heavy project detail windows mount only when opened, avoiding unnecessary gallery downloads. Windows come to rest below the wordmark at an offset measured from the title at runtime, cascade 26px apart, raise on click, and close on Escape. Opening steps out of its launcher in six coarse frames; closing runs continuously so the larger per-frame change does not read as a stutter. Both are skipped under `prefers-reduced-motion`. Tiles drop to two columns under 1000px and one under 620px.

## Daily billboard

The terminal wire across the lower desktop reads `/data/billboard.json`. It shows a rolling 72-hour summary of public activity from `abharrison1995-droid`, followed by five sourced technology headlines of no more than nine words each. If generation or deployment fails, the UI retains the most recent successful edition and has a truthful checked-in waiting state for first launch.

The daily GitHub Actions workflow runs at 07:30 Europe/London across daylight-saving changes and invokes `scripts/publish-billboard.mjs`. It commits the generated JSON to `main`, which uses the site's existing GitHub-to-Cloudflare deployment path. No database or public write endpoint is required.

Configure these repository secrets before enabling the scheduled publisher:

- `OPENAI_API_KEY` — used only by the GitHub Actions publisher.
- `GITHUB_READ_TOKEN` — optional; the publisher reads public events without it, but a read-only token raises GitHub API limits.

The publisher defaults to `gpt-5.6-luna` and uses the Responses API web-search tool with a strict JSON schema. It accepts only fresh story URLs present in the response's web-search evidence. No API key is shipped to the browser.

The `alex_has_tech` wordmark is set in Linebeam, self-hosted from `public/fonts/`. That font is free for personal, non-commercial use only and its licence asks that `linebeam.txt` stays alongside it — review before using this site commercially.

## Deployment

Pushes to `main` deploy automatically via Cloudflare Workers Builds (build command `npm run build`, deploy command `npx wrangler deploy --config dist/server/wrangler.json`). The custom domain is `alexhastech.dev`.
