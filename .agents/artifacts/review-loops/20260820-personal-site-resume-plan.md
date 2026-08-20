# Resumed Brute-Force Loop v1 — Drag Reliability and Accessibility

## Pre-flight

- Headroom: unknown; standard budget configuration retained.
- Scope: repair the remaining desktop-layout defects from the previous loop, add a non-drag equivalent for layout movement, and strengthen persistence/data validation. No scope expansion into identity, content assets, domains, deployment, analytics, or external services.

## Priority fixes

1. Correct swept collision for stationary axes: remote obstacles must not block pure horizontal/vertical moves, while aligned obstacles and all diagonal paths remain collision-safe.
2. Validate a saved layout before committing it: require the exact known-project key set, finite coordinates, current measured bounds, and pairwise clearance. Invalid storage clears and uses valid defaults without turning off enhancement.
3. Make layout fallback deterministic: disable enhanced absolute layout only when the actual stage/default composition cannot fit, otherwise preserve the desktop stage and Reset.
4. Make cancellation restore the original layout position, cancel queued work, and avoid persistence. Guard against non-primary/second-pointer races.
5. Provide a single-pointer and keyboard alternative to dragging. Each desktop window receives a compact Move control that opens directional movement actions; every action reuses legal geometry resolution, persists valid outcomes, retains focus, and announces the result. Drag remains optional.
6. Make drag instructions capability-aware, provide reset feedback through a polite live region, and preserve the existing no-JS/coarse-pointer normal-flow layout.
7. Strengthen registry validation (unique selector-safe slug, complete detail/safety fields, valid desktop size, exactly one featured project, coordinate sanity) and add tests for collision, storage/persistence helpers, and declarative project data.

## Acceptance checks

- Fast horizontal, vertical, and diagonal moves never cross an aligned obstacle; remote obstacles do not block stationary-axis motion.
- Numeric-but-invalid stored layouts never visibly commit; storage clears and default desktop remains draggable.
- Valid saved layout restores and persists after a normal move; reset clears it and announces once.
- Pointer cancel/lost capture restores exact origin and makes no storage write; normal pointer-up persists final legal layout.
- Wide fine-pointer desktop users can move windows by drag, by click/tap Move controls, and by keyboard; every resulting layout is bounded and non-overlapping.
- At narrow/coarse-pointer/no-JS, cards remain normal-flow and no unavailable-drag claim or inert control is exposed.
- `npm run lint`, `npm run typecheck`, `npm test`, and `git diff --check` pass.

## Known deferrals

- Real identity/contact/CV/domain, authentic screenshots, project links/downloads, ThinkPad compatibility evidence, social assets, security headers, and deployed deep-link verification remain owner/configuration dependent.
