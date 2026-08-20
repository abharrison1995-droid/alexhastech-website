# alex_has_tech

A software and game portfolio built with React and vinext, presented as a Windows-95 desktop. The page is a teal desktop carrying the `alex_has_tech` wordmark, with a taskbar across the top holding three programs: Projects completed, Projects in progress, and Get to know. Clicking one zooms a window out of its taskbar button; each window holds a four-across grid of project tiles that link through to ordinary project pages.

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

`npm test` builds the vinext app and runs rendered-page and project-registry tests. The scripts are compatible with Windows PowerShell.

## Content and interaction

Project records live in `app/data/projects.ts`; a project needs only its content record. Its `status` decides which window it appears in — `Released` goes to Projects completed, anything else to Projects in progress.

All three windows are server-rendered and start hidden, so tile content stays in the HTML for crawlers. Windows come to rest below the wordmark at an offset measured from the title at runtime, cascade 26px apart, raise on click, and close on Escape. Opening steps out of the taskbar button in six coarse frames; closing runs continuously so the larger per-frame change does not read as a stutter. Both are skipped under `prefers-reduced-motion`. Tiles are ordinary links and drop to two columns under 1000px and one under 620px.

The `alex_has_tech` wordmark is set in Linebeam, self-hosted from `public/fonts/`. That font is free for personal, non-commercial use only and its licence asks that `linebeam.txt` stays alongside it — review before using this site commercially.

## Deployment

Pushes to `main` deploy automatically via Cloudflare Workers Builds (build command `npm run build`, deploy command `npx wrangler deploy --config dist/server/wrangler.json`). Live at `alexhastech-website.alexhastech.workers.dev` until the custom domain is connected.
