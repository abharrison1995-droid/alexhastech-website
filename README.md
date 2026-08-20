# Project Portfolio

A compact, identity-neutral software and game portfolio built with React and vinext. It uses a restrained Windows-95-inspired interface: project windows remain ordinary links and a normal-flow list is always available; a bounded drag arrangement is an optional wide-desktop enhancement.

## Projects currently listed

- GBH England — a mobile role-playing game in development.
- CompTIA A+ revision suite — released.
- Libreboot/Coreboot ThinkPad mod-loader utility — active. This site does not publish model support, prerequisites, recovery instructions, downloads, or compatibility claims.

The portfolio includes owner-provided project screenshots (stored under `public/projects/<slug>/`) referenced by each project's `hero` and `gallery` fields. Public links, dates, metrics, personal identity, and contact details are not yet included; add verified material before publishing.

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

`npm test` builds the vinext app and runs rendered-page and pure desktop-geometry tests. The scripts are compatible with Windows PowerShell.

## Content and interaction

Project records live in `app/data/projects.ts`. An ordinary project needs only its content record. A project intended for the wide desktop arrangement also needs an explicit `desktop` layout entry; this prevents an added card from silently entering an invalid draggable composition.

Desktop dragging is enabled only at wide fine-pointer viewports. It is title-bar-only, bounded, collision-safe, stored locally when available, and resettable. Keyboard navigation uses the normal project links; window arrangement is decorative.
