# Brute-Force Loop v1 — Personal Site

## Pre-flight

- Headroom: unknown; proceed with the standard budget configuration.
- Scope: implement the first complete portfolio version described in `IMPLEMENTATION_PLAN.md`.
- Architecture decision: preserve the initialized vinext/React App Router starter and adapt the prior Astro-oriented structure. Do not introduce Astro, D1, authentication, a CMS, or external APIs.
- Content constraint: use only facts supplied by the owner. Omit or clearly mark unpublished screenshots, links, identity, metrics, dates, compatibility claims, and downloads.

## Priority plan

1. Replace the starter skeleton and metadata with a semantic portfolio home page.
2. Add typed local data for the CompTIA revision suite, ThinkPad mod loader, and mobile RPG.
3. Add three static project case-study routes with project-specific metadata and safe, honest copy.
4. Implement the Windows-95-inspired design system using system fonts, functional window chrome, restrained active states, and no copied Microsoft assets.
5. Build a conventional normal-flow mobile/no-JavaScript project surface first.
6. Add the desktop fine-pointer enhancement: title-bar-only drag, bounds clamping, 8px non-overlap clearance, axis-separated collision response, valid snapping, versioned local persistence, resize invalidation, and Reset layout.
7. Replace starter tests, add pure geometry tests, remove preview-only files/dependencies, and validate lint/build/test.
8. Run a six-perspective read-only verification swarm; fix material findings and repeat for no more than three total iterations.

## File plan

- Modify `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, and package metadata as needed.
- Add typed project data, shared components, pure desktop geometry/layout utilities, three project routes, a 404 route, and geometry tests.
- Remove `app/_sites-preview` and `react-loading-skeleton` after all imports and starter assertions are gone.
- Preserve hosting/worker configuration and keep D1/R2 unused.

## Acceptance checks

- Home and all three project routes server-render with unique, truthful content and metadata.
- Project access uses normal links and remains coherent without JavaScript.
- At eligible desktop/fine-pointer widths, windows drag only by title bars and never leave bounds or overlap.
- Invalid/stale stored layouts fall back atomically; Reset restores designed defaults.
- At mobile/coarse-pointer widths, projects use a static normal-flow layout and scrolling is unaffected.
- Keyboard focus is visible; links and Reset work conventionally; reduced-motion and forced-colours modes retain usable state.
- No fake controls, Microsoft assets, invented personal identity, metrics, dates, project links, screenshots, compatibility, or release claims.
- `npm run lint`, `npm run build`, and `npm test` pass.

## Deferred pending owner content

- Name, professional title, location, contact details, GitHub, CV, and domain.
- Authentic screenshots, repository/release/demo links, and project-specific dates.
- Verified ThinkPad model support, testing state, recovery procedure, and checksums.
- Original social preview and final favicon.
