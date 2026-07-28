# Roommate Finder

A swipe-based roommate matching app — Tinder's interface, but ranked on lifestyle
compatibility and housing logistics (budget, move-in date, commute) rather than
attraction.

Built with **Ionic React + Vite**, packaged for mobile with **Capacitor**.

> **Status: early prototype.** The app builds and runs, but the screens are
> placeholders and there is no backend yet. See [`docs/PLAN.md`](docs/PLAN.md)
> for the full audit, product definition, data model, matching algorithm and
> phased roadmap.

---

## Getting started

Requires **Node 22+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint (flat config, `eslint.config.js`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test.unit` | Vitest |
| `npm run test.e2e` | Cypress (needs the dev server running — see below) |

End-to-end tests expect the app on port 5173, so run `npm run dev` in one
terminal and `npm run test.e2e` in another.

---

## Project layout

```
src/
  App.tsx           Tab shell and routes
  pages/            Tab1 (swipe deck) · Tab2 (filters + listings) · Tab3 (empty)
  components/       Card, RoommateFinder, HouseListings
  theme/            Ionic CSS variables (currently empty — Phase 1)
  appwrite/         Placeholder; the backend decision is still open
server/
  mock-api.cjs      Throwaway Express mock. Not wired up, not part of the build.
cypress/e2e/        End-to-end specs
docs/PLAN.md        Product and engineering plan
```

The tab names are still the Ionic starter defaults. Renaming them to
Discover / Listings / Matches / Profile is the first task in Phase 1.

---

## Toolchain notes

Everything is on its latest release except two deliberate pins, both documented
in `package.json` under `"comments"`:

- **`react-router` stays on v5** — `@ionic/react-router` peer-requires `^5.0.1`.
  Moving to v6/v7 means dropping Ionic's router entirely.
- **TypeScript stays on 6.x** — `typescript-eslint` hard-errors on TypeScript 7.
  `tsc` alone works fine on 7; it's linting that breaks.

`react-tinder-card` declares stale peer ranges (React ≤18, react-spring ^9).
Both work on React 19 / react-spring 10, and `overrides` in `package.json`
accept the newer versions.

---

## CI

`.github/workflows/ci.yml` runs lint → typecheck → unit tests → build on every
pull request and every push to `main`. End-to-end tests are not in CI yet.

---

## Mobile

Capacitor is configured but no native project has been generated. To add one:

```bash
npm run build
npx cap add android
npx cap sync
```

`appId` and `appName` in `capacitor.config.ts` are placeholders — set them
before generating a native project, since the Android package name is painful
to change afterwards.

---

## Contributing

Work in phase order from [`docs/PLAN.md`](docs/PLAN.md); each phase is meant to
leave the app in a shippable state. Branch off `main`, keep CI green, and open a
pull request.
