# Personal Site — v2 Continuation (vinext/React durable plan)

## Pre-flight

- Architecture: preserve the vinext/React App Router starter; do not introduce Astro, D1, authentication, a CMS, or external APIs.
- Content constraint: use only owner-supplied facts; omit or clearly mark unpublished screenshots, links, identity, metrics, dates, compatibility claims, and downloads.

## Status at v2 start

Already implemented and verified (lint, typecheck, build, and 14 tests all green):

- Typed three-project data with registry validation (`app/data/projects.ts`).
- Home page, status strip, and desktop stage (`app/page.tsx`, `app/components/DesktopStage.tsx`).
- Win95-inspired design system (`app/globals.css`) with responsive, reduced-motion, and forced-colors rules.
- Pure geometry layout engine (`app/lib/desktop-geometry.ts`, `app/lib/desktop-layout.ts`) with unit tests.
- Static case-study routes with per-project metadata and BIOS safety section (`app/projects/[slug]/page.tsx`), plus 404.
- Cloudflare Worker entry preserved and unused D1/R2 bindings kept loose.

## v2 changes (this pass)

1. Removed dead starter code: `app/chatgpt-auth.ts`, `app/_sites-preview/`, `examples/d1/`, and `db/index.ts` (unused DB helper referencing `cloudflare:workers`).
2. Made `worker/index.ts` fully type self-contained: typed `Env` structurally (ASSETS + IMAGES) and used `vinext`'s `ExecutionContextLike`; dropped the dead `DB` binding.
3. Added `tsconfig.node.json` and extended `npm run typecheck` to cover tests + worker + db, with `allowImportingTsExtensions` for Node type-stripped `.ts` test imports.
4. Collapsed mobile/no-JS duplication by removing the separate "All projects" list and dead `ProjectCard` component; the desktop stage remains the single normal-flow surface on small/coarse screens.
5. Added an accessible label (`role="group"` + `aria-label`) to each title-bar drag handle.
6. Removed now-unreferenced `.project-list` CSS.

## Acceptance checks

- `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test` all pass.
- Home and three project routes server-render with unique, truthful content and metadata.
- Project access uses normal links and remains coherent without JavaScript.
- On eligible desktop/fine-pointer widths, windows drag only by title bars and never leave bounds or overlap; invalid/stale stored layouts fall back atomically; Reset restores defaults.
- On mobile/coarse-pointer widths, projects render once in a static normal-flow layout and scrolling is unaffected.
- Keyboard focus is visible; Move controls and Reset work conventionally; reduced-motion and forced-colors modes retain usable state.
- No fake controls, Microsoft assets, invented identity, metrics, dates, links, screenshots, compatibility, or release claims.

## v3 changes (screenshots pass)

1. Added owner-provided project screenshots under `public/projects/comptia-revision-suite/` (3 images) and `public/projects/gbh-england/` (5 images).
2. Renamed the flagship project from "Mobile RPG" to "GBH England" (slug `gbh-england`), updating home metadata, status strip, README, and tests.
3. Extended `Project` with optional `hero` and `gallery` image fields plus registry validation.
4. Rendered hero/gallery images on case-study pages and a hero thumbnail in desktop windows; added matching CSS.
5. All checks still green: lint, typecheck, build, and 14 tests.

## Deferred pending owner content

- Name, professional title, location, contact details, GitHub, CV, and domain.
- Repository/release/demo links and project-specific dates.
- Descriptive image captions (current alt text is generic placeholder copy).
- Verified ThinkPad model support, testing state, recovery procedure, and checksums.
- Original social preview and final favicon.
