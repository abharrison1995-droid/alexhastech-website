# Personal Project Portfolio — Original Design Brief

> Implementation architecture is superseded by the vinext/React durable plan in `.agents/artifacts/review-loops/20260820-personal-site-v2-plan.md`. This document remains the original product and visual brief; its Astro-specific sections are not the active implementation contract. The Hosting target/Domain lines and Phase 7 (deployment) have been updated to match the real Cloudflare Workers stack; the rest of section 3 (Astro, content collections, repository structure) is still the superseded plan.

## 1. Product objective

Build a fast, low-maintenance personal portfolio that presents finished and active software/game projects to employers, collaborators, and interested users.

The site should feel like a precise contemporary interpretation of Windows 95-era systems UI and Microsoft product/editorial design. It should not behave like a full operating-system simulation. The signature interaction is a bounded desktop canvas containing non-overlapping draggable project windows.

### Primary outcomes

- Make the owner's work understandable within 30 seconds.
- Give every substantive project a credible case-study page.
- Show current progress without making unfinished work appear abandoned.
- Demonstrate frontend craft through restrained, accessible interaction.
- Cost only the annual domain renewal under normal portfolio traffic.
- Make adding a new project a content task, not a redesign.

### Initial project set

1. CompTIA A+ revision application suite — released/usable.
2. Libreboot/Coreboot ThinkPad mod-loader utility — active or released, with strong safety documentation.
3. GBH England (mobile RPG) — in development and visually prominent.
4. Future projects — supported through the same project data model.

## 2. Experience principles

1. **Portfolio first.** Projects, outcomes, screenshots, and technical decisions remain clearer than the retro treatment.
2. **Functional nostalgia.** Every period-inspired detail communicates hierarchy, state, or interaction.
3. **Optional playfulness.** Dragging is an enhancement; browsing and opening work never depend on it.
4. **Controlled composition.** Windows cannot overlap or leave the desktop stage. A reset action restores the designed arrangement.
5. **Modern underneath.** Semantic HTML, responsive layouts, strong focus states, reduced-motion support, and quick loading are non-negotiable.
6. **No ornamental excess.** No fake boot sequence, cursor trails, CRT filter, looping ambient motion, fake terminal output, inert window buttons, or audio.

## 3. Recommended technical architecture

### Stack

- **Framework:** Astro with TypeScript and static output.
- **Styling:** global design tokens plus component-scoped CSS; no general-purpose UI kit.
- **Interaction:** a small native Pointer Events module for constrained dragging and collision handling.
- **Content:** Astro content collections using Markdown/MDX project records with validated frontmatter.
- **State:** `localStorage` only for the visitor's optional desktop arrangement and reduced local preferences.
- **Images:** checked-in, optimized WebP/AVIF project images with useful alt text; PNG only where lossless pixel artwork requires it.
- **Hosting target:** Cloudflare Workers (with static assets), deployed via `wrangler deploy`. The vinext build emits a Worker entry (`worker/index.ts`) plus a static-assets binding — not a classic static Pages deploy, so use Cloudflare **Workers Builds** (Git-connected CI for Workers) rather than the Pages product for automatic deploys from `main`.
- **Domain:** `alexhastech.dev`, registered and added to the Cloudflare account, with a Worker route/custom domain binding pointing the apex (and `www` if used) at the deployed Worker.

### Why this architecture

- The site has no requirement for accounts, a database, payments, or server-side business logic.
- Static output minimizes cost, attack surface, maintenance, and page-load time.
- Content collections make future projects consistent while allowing rich case studies.
- Native drag logic is smaller and more controllable than adopting a drag-and-drop framework that still needs custom collision behaviour.

### Proposed repository structure

```text
/
├─ public/
│  ├─ favicon.*
│  ├─ og.png
│  └─ media/projects/<project-slug>/
├─ src/
│  ├─ components/
│  │  ├─ DesktopStage.astro
│  │  ├─ ProjectWindow.astro
│  │  ├─ WindowChrome.astro
│  │  ├─ StatusBar.astro
│  │  ├─ SiteNav.astro
│  │  ├─ ProjectMeta.astro
│  │  └─ DecorativePlaque.astro
│  ├─ content/
│  │  ├─ config.ts
│  │  └─ projects/*.mdx
│  ├─ layouts/
│  │  ├─ BaseLayout.astro
│  │  └─ ProjectLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ projects/[...slug].astro
│  │  ├─ about.astro
│  │  ├─ cv.astro
│  │  └─ 404.astro
│  ├─ scripts/
│  │  └─ desktop-drag.ts
│  └─ styles/
│     ├─ tokens.css
│     ├─ global.css
│     ├─ window.css
│     └─ print.css
├─ astro.config.*
└─ package.json
```

The CV route can initially be a concise web résumé plus a link to a downloadable PDF. It should not expose a home address, personal phone number, or unnecessary private data.

## 4. Information architecture

### Home page

The home page is the primary portfolio surface.

1. Compact fixed or anchored navigation: name/mark, Projects, About, CV, GitHub, Contact.
2. Short introduction: role/interest statement and one sentence describing the work.
3. Bounded desktop stage containing the featured project windows.
4. Small background-level plaques for availability, latest update, and current focus.
5. Status strip containing project counts, last meaningful update, and Reset layout.
6. A normal-flow project list directly below the interactive stage, available to smaller screens and assistive technology and useful as a robust fallback.
7. Minimal footer with copyright, source link if public, and contact links.

### Project case-study pages

Each page should answer:

1. What problem does this project solve?
2. Who is it for?
3. What did the owner personally build?
4. What technical choices were made and why?
5. What is working today?
6. What remains in progress?
7. Where can someone see code, download a release, or follow development?

Recommended order:

- Project title, status, one-sentence outcome, primary action.
- Hero screenshot or real product photograph.
- Overview and user problem.
- Selected features.
- Technical approach and stack.
- Constraints, trade-offs, or difficult decisions.
- Gallery or short demo clip.
- Current status and next milestone.
- Repository/release links.
- Related or next project.

### BIOS utility-specific treatment

- Clearly state supported models and prerequisites.
- Explain backup and recovery expectations.
- Distinguish tested, experimental, and unsupported paths.
- Include an explicit risk disclaimer without alarmist language.
- Never imply bypassing ownership, platform security, or access controls.
- Prefer linking to versioned releases and checksums over a generic direct binary.

## 5. Content model

Each project record should use a consistent schema:

```ts
type Project = {
  title: string;
  slug: string;
  summary: string;
  outcome: string;
  status: "released" | "in-development" | "experimental" | "archived";
  featured: boolean;
  featuredOrder: number;
  yearStarted: number;
  yearCompleted?: number;
  role: string[];
  technologies: string[];
  platforms: string[];
  heroImage: string;
  heroAlt: string;
  gallery?: Array<{ src: string; alt: string; caption?: string }>;
  repositoryUrl?: string;
  releaseUrl?: string;
  demoUrl?: string;
  changelogUrl?: string;
  lastUpdated: string;
  nextMilestone?: string;
  window: {
    size: "large" | "medium" | "small";
    initialX: number;
    initialY: number;
  };
};
```

Coordinates should be normalized to the desktop stage rather than permanently stored as device pixels. This allows the designed layout to scale within supported desktop widths.

## 6. Visual system

### Core palette

```css
:root {
  --canvas: #10131a;
  --canvas-alt: #0b1730;
  --surface: #c0c0c0;
  --content: #fffdf7;
  --caption-active: #000080;
  --selection: #0000a8;
  --teal: #008080;
  --ink: #111111;
  --disabled: #808080;
  --highlight: #ffffff;
  --shadow: #404040;
  --grid: 8px;
}
```

Final colours must be checked in context for text and focus contrast; the palette is a starting contract, not permission to use low-contrast period defaults.

### Geometry

- Square corners throughout the retro chrome.
- 8px spacing rhythm.
- 22–24px visual title bars on desktop, while preserving an adequate interactive hit area.
- 2px outer window treatment, with 1px internal dividers.
- Raised edges use light top/left and dark bottom/right borders.
- Recessed content wells invert that treatment.
- No contemporary card shadows, glass effects, large radii, or decorative gradients.

### Typography

- UI labels/title bars: a system-derived sans stack, 12–13px, medium or bold.
- Body: Inter or a robust system sans stack, 15–17px with approximately 1.5 line height.
- Metadata: `ui-monospace` or IBM Plex Mono, 11–12px.
- A bitmap font may appear in no more than two or three decorative labels.
- Microsoft font files, logos, wordmarks, screenshots, icons, and sounds must not be redistributed as site assets.

### Imagery

- Use real screenshots from each project wherever possible.
- Use hardware photography for the BIOS utility and genuine in-game captures for the RPG.
- Crop images to deliberate 4:3 or square wells.
- Use at most one dithered/bitmap-treated decorative image in the first viewport.
- Do not use generic generated technology imagery.
- Produce a dedicated social preview image only after the visual identity and copy are stable.

## 7. Desktop-stage layout

### Initial composition

- Desktop stage uses a deliberately composed, approximately 16:10 region within the page—not necessarily the full viewport.
- RPG window: largest and visually dominant.
- CompTIA suite: medium-sized with product screenshot and released status.
- BIOS utility: medium-sized with hardware/tool screenshot and clear status.
- Decorative plaques: maximum three; visually behind project windows and ignored by collision detection.
- Maintain meaningful negative space so the stage does not resemble an accidental pile of dialogs.

### Active and inactive state

- Only one project window is selected at a time.
- Selected/dragged/focused window: navy caption, white title, precise blue outline.
- Inactive windows: muted grey caption and dark text.
- Selection changes do not alter stacking because project windows cannot overlap.
- The same visual state is used for pointer hover and keyboard focus where appropriate.

## 8. Drag and collision specification

### Behavioural contract

1. Drag begins only from the title-bar handle.
2. Pointer movement below a 5–8px threshold remains a click, preventing accidental drags.
3. Each proposed position is clamped to the desktop-stage bounds.
4. Project-window rectangles maintain a 4–8px clearance from one another.
5. Windows never push other windows in version one.
6. Movement resolves one axis at a time, allowing a dragged window to slide naturally along obstacles.
7. Legal edges can magnetically snap when within approximately 8–10px.
8. Snapping is applied only after confirming the snapped position does not overlap another project.
9. Dragging tracks the pointer directly without easing or lag.
10. Release may use a 100–140ms settle transition; reduced-motion mode makes it instant.
11. Positions are saved to `localStorage` only after a valid drop.
12. Reset layout clears saved positions and restores the art-directed defaults.

### Collision approach

- Use axis-aligned bounding boxes for all project windows.
- On pointer movement, calculate candidate X and Y in stage coordinates.
- Clamp the candidate rectangle to the stage.
- Resolve X against all other expanded project rectangles.
- Resolve Y from the valid X result.
- Apply a valid snap candidate.
- Write position through `transform: translate3d(...)` during drag to avoid layout reflow.
- Commit final accessible style/state at pointer release.

Alternative if axis resolution feels sticky: binary-search the movement fraction between the last legal and proposed positions to find the nearest legal hard-stop point. Do not add spring physics or collision-driven chains in version one.

### Resizing and saved-layout validation

- Define explicit desktop layout presets for supported width ranges.
- When crossing a breakpoint or changing orientation, revalidate every saved rectangle.
- If any saved window is outside bounds or overlapping, discard the saved arrangement and use the correct preset.
- Add a version number to the stored layout so future card changes invalidate stale coordinates cleanly.

## 9. Responsive behaviour

### Wide desktop

- Interactive bounded stage enabled.
- All three featured project windows visible simultaneously.
- Decorative plaques may be partially occluded by project windows.

### Compact desktop/tablet landscape

- Use an alternate valid window preset or reduce the number of simultaneously featured windows.
- Drag remains enabled only if the stage comfortably supports it and the device has a fine pointer.

### Tablet portrait and mobile

- Disable free dragging.
- Render project windows as a deliberate single-column stack or compact grid in normal document flow.
- Preserve window chrome, status, screenshots, and active/focus styling.
- Never apply `touch-action: none` to the page, stage, or project body.
- Project pages and navigation behave like conventional responsive web pages.

Use capability queries such as `(pointer: fine)` in addition to width. A small laptop and a large touch device should not be treated as identical merely because their viewport widths match.

## 10. Motion specification

- No ambient, looping, or entrance animation is required.
- Hover/focus: scale between `1.01` and `1.015`, 120–150ms, restrained ease-out.
- Hover/focus should not translate the card or cause layout reflow.
- Pressed state: remove scale and invert/recess the appropriate bevel over 70–90ms.
- Drag: no easing.
- Snap settlement: 100–140ms ease-out.
- `prefers-reduced-motion: reduce`: remove transforms and transitions while retaining instant state changes and visible focus.

## 11. Accessibility requirements

- Every project is a semantic `article` with a real heading and link in the DOM.
- Project access never depends on dragging or window position.
- Keyboard users can tab to each project and activate it with standard link behaviour.
- `:focus-visible` uses a persistent, high-contrast indicator at least as clear as the selected-window state.
- If keyboard rearrangement is later added, it must use an explicit move mode with arrow keys, Escape to cancel, and an announced result. It is not required for version one because arrangement is decorative.
- Reset layout is a normal button usable by keyboard and single-pointer input.
- Decorative plaques/images are `aria-hidden` when they convey no unique information.
- Meaningful images have specific alt text; purely decorative images use empty alt text.
- Title-bar drag handles receive an accessible label and do not contain fake close/minimize buttons.
- Maintain logical reading and tab order regardless of visual coordinates.
- A skip link bypasses repeated navigation.
- Text, links, active states, and focus indicators meet WCAG 2.2 AA contrast expectations.
- Test at 200% zoom and with Windows High Contrast/forced-colours mode.

## 12. Performance and resilience

### Performance targets

- Lighthouse performance target: 90+ on representative mobile hardware.
- Keep first-load JavaScript limited to the drag enhancement and essential navigation.
- Reserve image dimensions to prevent layout shift.
- Keep the first viewport image payload conservative; lazy-load below-fold galleries.
- Avoid webfont dependency for critical UI. If Inter/IBM Plex Mono is self-hosted, subset it and use `font-display: swap`.

### Progressive enhancement

- Without JavaScript, the home page still shows every featured project in a coherent static arrangement/list.
- If stored layout data is invalid, the default composition loads.
- If Pointer Events are unavailable or the device is unsuitable, dragging is absent without affecting navigation.

## 13. SEO, sharing, and employer-facing polish

- Unique title and description for every project page.
- Canonical URLs once the domain is selected.
- Open Graph and social-card metadata at site and project level.
- JSON-LD for `Person`, `WebSite`, and appropriate `SoftwareApplication`/`VideoGame` project records.
- Generated sitemap and useful `robots.txt`.
- Human-readable project URLs, e.g. `/projects/comptia-revision-suite/`.
- Favicon and application icons should be original, simple, and compatible with the visual system.
- Include a concise contact method, GitHub link, location at city/region granularity if desired, and CV route.
- Do not expose email directly in source if spam is a concern; a lightly obfuscated `mailto` link is sufficient for version one. Avoid a hosted contact-form backend unless genuinely needed.

## 14. Analytics and privacy

Version one should either have no analytics or use a privacy-conscious, cookie-free measurement option provided by the host. Do not add advertising trackers, session replay, fingerprinting, or a consent banner merely to collect vanity metrics.

Useful measurements, if enabled:

- project case-study visits;
- repository/release/demo outbound clicks;
- CV download clicks;
- aggregate device and viewport categories.

Drag movement itself should not be tracked.

## 15. Security and project-download handling

- Use HTTPS everywhere and redirect HTTP.
- Do not embed secrets in the repository or build configuration.
- Link to versioned GitHub releases rather than hosting executables inside the portfolio where practical.
- Publish hashes/signatures for downloadable utilities when available.
- Use `rel="noopener noreferrer"` for relevant external destinations.
- Add a conservative Content Security Policy once the final asset and analytics requirements are known.
- Keep dependencies minimal and enable automated dependency alerts.
- For the BIOS utility, separate documentation from execution and make compatibility/risk information visible before download.

## 16. Testing strategy

### Automated checks

- Type checking and production build on every pull request.
- Linting/format checking.
- Unit tests for rectangle intersection, clamping, snapping, axis resolution, stored-layout validation, and reset behaviour.
- Browser tests for opening each project, reset layout, bounds enforcement, no-overlap invariant, and mobile drag disablement.
- Automated accessibility scan for the home page and representative project page.
- Broken internal-link and missing-image checks.

### Manual checks

- Chrome, Firefox, Edge, and Safari/WebKit representative testing.
- Mouse, trackpad, keyboard-only, and touch/coarse-pointer testing.
- Drag slowly and rapidly into every boundary and corner.
- Attempt to trap one window between two others.
- Resize across every responsive breakpoint after rearranging windows.
- Reload with a saved layout and after a layout-schema version change.
- Check 200% and 400% zoom.
- Check reduced motion, forced colours, and high contrast.
- Confirm project pages remain clear with CSS or JavaScript unavailable.
- Review every page for spelling, stale status labels, and placeholder content.

## 17. Delivery phases

### Phase 0 — Content and identity inventory

- Confirm display name, short professional description, contact route, GitHub/profile links, and CV availability.
- Select the domain shortlist without purchasing until availability and renewal costs are checked.
- Collect real screenshots, repository URLs, release links, supported platforms, technology lists, and current statuses.
- Draft one-sentence outcome statements for the three initial projects.
- Decide whether the BIOS utility is public, downloadable, documentation-only, or temporarily listed as in development.

**Exit criteria:** enough real content exists to avoid designing around placeholders.

### Phase 1 — Foundation and content model

- Initialize the Astro TypeScript project and source control.
- Establish routes, shared layout, content collection schema, and design tokens.
- Add the three project records and a representative case-study page.
- Configure image optimization, basic metadata, sitemap, and a useful 404 page.

**Exit criteria:** the static site builds and all project content is reachable through normal links.

### Phase 2 — First meaningful visual slice

- Build the home-page stage, one flagship RPG project window, introduction, and status strip.
- Implement the authentic window frame, typography, palette, active state, and a real project screenshot.
- Verify desktop and mobile layouts before adding drag behaviour.

**Exit criteria:** a visitor can recognize the intended visual language and understand the flagship project without animation or drag.

### Phase 3 — Complete portfolio surface

- Add the CompTIA and BIOS project windows.
- Add no more than three decorative background plaques.
- Complete the normal-flow responsive project list and primary navigation.
- Build all initial case-study pages with real project-specific copy and images.

**Exit criteria:** all initial projects are professionally presentable and the composition works as a static site.

### Phase 4 — Constrained drag enhancement

- Implement title-bar Pointer Events with pointer capture and movement threshold.
- Add bounds clamping, non-overlap collision resolution, valid snapping, active states, saved layout, reset, and responsive invalidation.
- Add unit and browser tests for the spatial invariants.
- Tune interaction on real mouse and trackpad hardware.

**Exit criteria:** windows never overlap or escape the canvas during tested interactions, and all projects remain accessible without dragging.

### Phase 5 — Responsive, accessible, and performance pass

- Finalize breakpoint/capability behaviour and mobile static composition.
- Add reduced-motion and forced-colours rules.
- Complete focus, semantic, alt-text, contrast, zoom, and keyboard checks.
- Optimize images and fonts and remove unnecessary client code.

**Exit criteria:** target browsers pass the manual matrix, automated accessibility findings are resolved, and representative performance meets the target.

### Phase 6 — Employer-facing finish

- Final copy edit for clarity, specificity, and spelling.
- Add web CV, downloadable CV, original favicon, and social preview.
- Add structured data and validate all metadata.
- Verify repository/release/download links and BIOS safety language.

**Exit criteria:** the site is appropriate to send directly to an employer.

### Phase 7 — Deployment and domain

- GitHub repository created (`alexhastech-website`, public) — done.
- Worker deployed manually and renamed to `alexhastech-website` (was `site-creator-vinext-starter`) — done. Live preview: `alexhastech-website.alexhastech.workers.dev`.
- Do **not** add a static `wrangler.jsonc`/`wrangler.toml` at the project root — it would conflict with the config that's generated fresh into `dist/server/wrangler.json` on every `npm run build` (name, compatibility date, D1/R2 bindings all come from `vite.config.ts`/`.openai/hosting.json`). This was confirmed the hard way: a stale local `.wrangler/deploy/config.json` pointing at a different base path than a root config caused a "found both a user configuration file and a deploy configuration file" deploy failure.
- Connect the repository to Cloudflare **Workers Builds** (Git-connected CI for Workers — not the Pages product, since this project deploys a Worker with a static-assets binding rather than a static Pages site). Configure it with a custom build command (`npm run build`) and deploy command (`npx wrangler deploy --config dist/server/wrangler.json`) rather than relying on auto-detection, so it deploys from the generated config instead of expecting a root one. Verify deployments trigger on push to `main`.
- Decide whether D1/R2 are actually needed; both are currently disabled (`.openai/hosting.json` has `d1`/`r2` set to `null`). Leave disabled unless a real use case appears — avoid provisioning unused Cloudflare resources.
- Register `alexhastech.dev` through a reputable registrar after checking renewal price, then add it to the Cloudflare account.
- Configure a Worker route or custom domain binding for the apex (and `www` if used); choose one canonical URL and redirect the other.
- Verify HTTPS, DNS, sitemap, social preview, canonical metadata, and 404 behaviour.
- Add a lightweight update procedure (how to deploy, how to roll back) to the repository README.

**Exit criteria:** production is reachable through the custom domain, deploys automatically from the repository via Workers Builds, and can be updated without manual server work.

## 18. Definition of done for version one

- The home page clearly identifies the owner and their area of work.
- Three real projects appear with accurate status and meaningful descriptions.
- Each project has a dedicated, shareable case-study page.
- Desktop project windows can be dragged by their title bars.
- Windows cannot overlap each other or leave the bounded stage.
- Reset layout restores the default arrangement.
- Mobile/touch presentation is deliberate and does not require dragging.
- All core navigation and project access work with keyboard only.
- Reduced-motion, focus, contrast, zoom, and semantic requirements are met.
- The site remains usable when JavaScript fails.
- Images are optimized and project screenshots are authentic.
- There are no fake controls, placeholder metrics, generic AI artwork, or copied Microsoft assets.
- Production builds cleanly and deploys automatically.
- Apex and `www` resolve securely to the canonical custom domain.
- Adding a fourth project requires only a new content record and media, not layout surgery.

## 19. Explicitly deferred from version one

- User accounts or authentication.
- Database or CMS.
- Comments, likes, or public progress editing.
- Full simulated desktop, Start menu, task switching, minimizing/maximizing, or overlapping windows.
- Browser-hosted game builds unless a project specifically needs one and performance/security are reviewed.
- Contact-form backend.
- Complex page transitions or ambient animation.
- Automatic GitHub activity feeds, which can become noisy and create external API dependencies.

## 20. Implementation risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Retro styling overwhelms the actual work | Medium | High | Gate every decorative element by function; use real project content early. |
| Collision feels sticky or jittery | Medium | Medium | Axis-separated hard stops, no push chains, direct pointer tracking, real-device tuning. |
| Saved layouts break after resize/content changes | Medium | Medium | Normalized coordinates, layout versioning, validation, deterministic presets. |
| Drag conflicts with links or selection | Medium | Medium | Title-bar-only handle and 5–8px movement threshold. |
| Touch drag blocks scrolling | High if enabled | High | Disable free drag on coarse-pointer/mobile layouts. |
| Pixel typography harms readability | Medium | Medium | Use system sans for UI/body and reserve bitmap type for tiny decorative labels. |
| Project pages become vague showcases | Medium | High | Enforce the content schema and case-study questions before visual polish. |
| BIOS project raises trust/safety concerns | Medium | High | Visible compatibility, backup, recovery, checksums, versioned releases, and disclaimer. |
| Copyright/trademark confusion | Low–Medium | Medium | Original icons/assets, no Microsoft logos/screenshots/sounds, no implication of affiliation. |

## 21. Recommended build order inside each feature

For every page or interaction, work in this sequence:

1. Semantic content and normal-flow layout.
2. Responsive structure.
3. Period-inspired visual styling.
4. Keyboard and focus behaviour.
5. Pointer enhancement and motion.
6. Automated tests.
7. Real-browser and real-device verification.

This order ensures that the visual concept enhances a complete portfolio rather than becoming the portfolio's only substance.
