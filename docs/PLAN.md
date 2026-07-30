# Roommate Finder — Product & Engineering Plan

_A swipe-based roommate matching app (Ionic React + Capacitor)._

This document is the working plan for turning the current Hackville prototype into a
real, demoable product. It covers: what exists today, what the product actually is,
the data model, the matching algorithm, architecture decisions, and a phased
roadmap with a concrete backlog.

---

## 1. Current state (2026-07-30)

Phase 0 is fully done, and a slice of Phase 1 landed alongside it (backend
scaffold + design system got built before the tab/route rework, since they
were unblocked and independent). Concretely, right now:

| Area | State |
|---|---|
| Build / lint / typecheck / unit tests | ✅ Green, in CI on every PR |
| E2E (Cypress) | ✅ Wired into CI as its own job, 3/3 passing |
| Design system | ✅ `theme/variables.css` has a real palette (indigo primary, coral "like" accent, teal success, red danger), dark mode auto-follows OS via existing `dark.system.css` |
| Swipe deck | ✅ `react-tinder-card`-based, full-bleed photo cards, proper z-index stacking. Still shows **placeholder data** (20 identical stock-photo cards) — no real profiles yet |
| Supabase project | ✅ Created, live, region `ca-central-1` |
| DB schema | ✅ All 9 tables from §4 applied via `supabase/schema.sql`, RLS enabled on every table, verified reachable (`GET /rest/v1/profiles` → 200) |
| `.env.local` | ✅ Populated with real `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| Typed API layer (`src/lib/api/*`) | ❌ Not started — `src/lib/supabase.ts` exports a raw client, nothing wraps it yet, and nothing in the app imports it |
| Tab/route rework | 🟡 Half done — tab **labels** changed (Discover/Listings/Profile) but **routes are still** `/tab1` `/tab2` `/tab3`, and there's no `/matches` or `/chat/:matchId` yet |
| Auth | ❌ Not started |
| Onboarding quiz | ❌ Not started |
| Matching engine (`src/lib/matching.ts`) | ❌ Not started |
| Seed data | ❌ Not started — DB has 0 rows |
| `RoommateFinder.tsx` / `HouseListings.tsx` | 🟡 Original hackathon placeholders, unchanged — still POST to nonexistent mock-API ports, still have the gender/nationality/relationship-status filter set §7 flags for rework |

**Read:** the shell (build, tests, CI, theming, backend plumbing) is solid.
Nothing in the product's actual value proposition — real profiles, real
matching, real auth — exists yet. That's exactly Phase 1's remaining scope,
detailed in §9.

### Starting point (historical — hackathon prototype, before Phase 0)

The repo was an Ionic React (Vite) starter with three tab pages and four
half-finished components. **The app did not build.** Findings from the
original full pass over `src/`:

| Area | State | Notes |
|---|---|---|
| Build | ❌ Broken | `npx tsc --noEmit` fails with 4 errors in `src/components/Card.tsx`, so `npm run build` (which is `tsc && vite build`) cannot succeed. |
| `src/components/Card.tsx` | ❌ Broken | Lines 32–48: references `this.hostElement` inside a function component, calls `createGesture`/`Gesture` without importing them, and uses top-level `await` in a non-async body. It also hand-rolls touch drag (lines 13–30) that only resets position — no swipe-out, no like/pass outcome, and touch-only (no mouse, so it's dead on desktop). |
| `src/components/PersonalityAnalysis.tsx` | ❌ Misplaced | This is an **Express server** (`require('express')`, `app.listen(3001)`) living in the components folder. It's not imported anywhere, `express` is not in `package.json`, and it would break the Vite bundle the moment anything imports it. Its endpoint is `/api/find-roommates`; the frontend calls `/api/roommates`. Contract mismatch. |
| `src/components/RoommateFinder.tsx` | 🟡 Placeholder | A filter form that POSTs to a hardcoded `http://localhost:5000/api/roommates` — a third port, matching neither the mock server (3001) nor the Vite dev server. No loading state, no error surface, no empty state. |
| `src/components/HouseListings.tsx` | 🟡 Placeholder | Raw HTML form (no Ionic components) inside an Ionic app, so it's unstyled and off-theme. POSTs to `/api/recommendations`, which doesn't exist. The `houseType` `<select>` has **four options all labelled "Studio"** with different values (lines 83–85). Renders one blank listing on first paint because `listings` is initialised with an empty object. |
| `src/pages/Tab1.tsx` | 🟡 Placeholder | "Find Friends" — infinite-scrolls 20 identical placeholder cards, all the same stock image. Contains a dead `getInitialState()` function (lines 16–24) left over from moving state into `Card`. Missing React `key` on the mapped `<Card>`. |
| `src/pages/Tab2.tsx` | 🟡 Placeholder | Renders `ExploreContainer` + `HouseListings` + `RoommateFinder` stacked. `RoommateFinder` renders its own `IonPage`/`IonHeader` **nested inside** Tab2's `IonPage` — invalid structure that breaks Ionic's page/scroll model. |
| `src/pages/Tab3.tsx` | ⚪ Empty | Untouched starter. |
| `src/appwrite/` | ⚪ Empty | Just a `.gitkeep`. A commit ("added appwrite") signalled backend intent, but no SDK dependency and no code. **There is no backend and no persistence of any kind.** |
| `src/theme/variables.css` | ⚪ Empty | 2 lines. No design system, no brand. All three `pages/*.css` files are empty. |
| Tests | ⚪ Starter only | `App.test.tsx` is the default smoke test. `cypress/e2e/test.cy.ts` asserts `'Tab 1 page'`, text that no longer exists — **the e2e test is already failing.** |
| CI | ❌ None | No `.github/workflows`. Nothing would have caught the broken build. |
| Identity | 🟡 Sloppy | `appId: 'io.ionic.starter'`, `appName: 'Hackville2025\\'` (stray backslash, in both `capacitor.config.ts` and `ionic.config.json`), page title "Ionic App", starter `manifest.json`. No README. |
| Unused deps | 🟡 | `react-tinder-card` is installed but never imported — the swipe was hand-rolled instead. `axios` is used in one place while `HouseListings` uses `fetch`. |

**Read:** there are three or four independent spikes here (swipe cards, roommate
filters, house listings, a mock API) that were never joined into one product.
Nothing talks to anything else. That's normal for hour 30 of a hackathon — the
plan below is about picking one spine and building it properly.

---

## 2. What the product is

> **Tinder for roommates.** You build a profile describing how you actually live,
> you swipe through compatible people (and rooms), and when it's mutual you can
> chat and go from there.

The core insight worth building around: **roommate matching is not dating.** The
Tinder *interface* is right — low-commitment, one decision at a time, fast — but
the *ranking* has to be driven by lifestyle compatibility and hard logistics
(budget, move-in date, location), not attraction. A pretty profile that's £400
over your budget and 40 minutes from campus is a wasted swipe.

**Primary user:** a student or early-career professional who needs to find
housing for a specific term, and would rather live with someone compatible than
with a stranger from a Facebook group.

### Three user roles (one account can be more than one)

1. **Has a place, needs a person** — a room in an existing house/apartment. They
   post a *listing* and swipe on *people*.
2. **Needs a place** — swipes on both *listings* and *people*.
3. **Forming a group** — has no place yet, wants to find 1–3 people and then hunt
   together. This is the most common student case and the one existing apps do
   worst. **This is the differentiator worth leaning into.**

### What we deliberately do NOT build

- Payments, rent splitting, lease signing, escrow. Big regulatory surface, no
  demo value.
- A listings scraper / aggregator. Legal grey area with Kijiji/Facebook, and it
  makes the product a search engine instead of a matching product.
- **AI-fabricated listings.** `HouseListings.tsx` currently renders a section
  headed "AI-Generated Listings". Inventing housing that doesn't exist is worse
  than useless — it's actively harmful to someone apartment-hunting, and it will
  get called out in any demo Q&A. Listings must be real and user-posted. (An LLM
  *summarising or normalising a listing a user pasted in* is fine — see §8.)

---

## 3. Core user flows

```
Sign up ──► Verify email ──► Onboarding quiz (~12 q) ──► Set housing intent
                                                              │
                                    ┌─────────────────────────┴──────────┐
                                    ▼                                    ▼
                            Discover (swipe deck)                 Post a listing
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                   Pass (left)             Like (right)
                                                │
                                        mutual? ─┴─► Match ──► Chat ──► meet up
```

### Screens (target information architecture)

Replace Tab1/Tab2/Tab3 with five named tabs:

| Tab | Route | Purpose |
|---|---|---|
| **Discover** | `/discover` | The swipe deck. People and/or rooms, ranked by compatibility. The heart of the app. |
| **Listings** | `/listings` | Browse rooms in list/map form with filters — the "I want to scan, not swipe" mode. Also where you post your own. |
| **Matches** | `/matches` | Mutual matches, unread badges, opens into chat. |
| **Chat** | `/chat/:matchId` | 1:1 messaging. Pushed, not a tab. |
| **Profile** | `/profile` | Your profile, lifestyle answers, preferences, verification, settings. |

Onboarding lives at `/onboarding` outside the tab shell.

---

## 4. Data model

Names are given in Postgres-flavoured snake_case; adapt if we land on Appwrite.

### `profiles`
| field | type | notes |
|---|---|---|
| `id` | uuid PK | = auth user id |
| `display_name` | text | first name + initial |
| `birthdate` | date | store the date, compute age; never store age |
| `pronouns` | text | free text, optional |
| `bio` | text | 300 char cap |
| `photos` | text[] | storage keys, max 6, first is primary |
| `occupation` | enum | `student` / `working` / `both` / `other` |
| `school_or_employer` | text | optional |
| `verified_email` | bool | institutional email verified |
| `last_active_at` | timestamptz | powers recency ranking |
| `created_at` | timestamptz | |

### `lifestyle` (the compatibility vector — 1:1 with profile)
All 1–5 Likert unless noted. This is what the onboarding quiz fills in.

| field | 1 ←→ 5 |
|---|---|
| `sleep_schedule` | early bird ←→ night owl |
| `cleanliness` | relaxed ←→ spotless |
| `noise_tolerance` | need quiet ←→ noise doesn't bother me |
| `guest_frequency` | never ←→ constantly |
| `sociability` | housemates are housemates ←→ housemates are friends |
| `wfh_days` | 0–7 (integer, not Likert) |
| `smoking` | enum: `none` / `outdoor_ok` / `indoor` |
| `cannabis` | enum: same shape |
| `drinking` | enum: `none` / `social` / `frequent` |
| `pets_owned` | enum: `none` / `cat` / `dog` / `other` |
| `pets_ok_with` | enum: `any` / `cats_only` / `dogs_only` / `none` / `allergic` |
| `kitchen_sharing` | enum: `share_everything` / `share_space_not_food` / `separate` |
| `dealbreakers` | text[] | up to 3 field names the user marks as non-negotiable |

### `housing_intent` (1:1 with profile)
`role` (`has_place` / `needs_place` / `forming_group`), `budget_min`, `budget_max`,
`move_in_earliest`, `move_in_latest`, `lease_months`, `city`, `neighbourhoods[]`,
`anchor_lat`/`anchor_lng` (campus or workplace — powers "20 min from where you
actually go"), `max_commute_minutes`.

### `listings`
`id`, `owner_id`, `title`, `description`, `rent_monthly`, `utilities_included`
(bool), `deposit`, `room_type` (`private` / `shared` / `entire_unit`),
`property_type` (`apartment` / `house` / `condo` / `basement` / `studio`),
`furnished`, `sqft`, `bedrooms_total`, `bathrooms`, `current_occupants`,
`available_from`, `lease_months`, `amenities[]` (laundry, parking, AC, dishwasher,
wifi included), `photos[]`, `lat`/`lng`, `address_exact` (**private, revealed only
after match**), `neighbourhood` (public), `status` (`active`/`paused`/`filled`).

### `swipes`
`id`, `swiper_id`, `target_type` (`profile` / `listing`), `target_id`,
`direction` (`like` / `pass`), `created_at`. Unique index on
`(swiper_id, target_type, target_id)` — one decision per pair, and it's what makes
the deck never repeat.

### `matches`
`id`, `user_a`, `user_b` (store with `user_a < user_b` so the pair is canonical),
`listing_id` (nullable), `created_at`, `expires_at`, `status`
(`active` / `expired` / `unmatched`).

### `messages`
`id`, `match_id`, `sender_id`, `body`, `created_at`, `read_at`.

### `reports` / `blocks`
`reporter_id`, `target_id`, `reason` enum, `details`, `created_at`, `status`.
Blocks are bidirectional and filter the deck at the query level.

---

## 5. The matching algorithm

This is the part that makes it a product rather than a UI demo. Keep it a **pure,
dependency-free function** (`src/lib/matching.ts`) so it's trivially unit-testable
and can later move server-side unchanged.

### Stage 1 — Hard filters (binary; fail = never shown)

- Budget ranges overlap (with a configurable ±10% grace).
- Move-in windows overlap.
- Same city / within `max_commute_minutes` of the anchor point.
- Pet conflict: `pets_ok_with = 'allergic'` vs the other party owning that pet.
- Smoking conflict: one wants `none`, the other is `indoor`.
- Either party's declared **dealbreakers** are violated by >2 points on the Likert scale.
- Not already swiped, not blocked, not self, profile is complete and active.

### Stage 2 — Compatibility score (0–100)

Weighted normalised distance over the Likert dimensions:

```ts
score = 100 * (1 - Σ(wᵢ · |aᵢ - bᵢ|) / (4 · Σwᵢ))
```

- `wᵢ` defaults to 1, and is **3** for any dimension the user flagged as a
  dealbreaker.
- 4 is the max distance on a 1–5 scale, so the ratio lands in [0, 1].
- Enum fields (smoking, pets, kitchen) score via a small hand-written
  compatibility matrix rather than a distance.
- Asymmetry is real and fine: `score(A→B)` may differ from `score(B→A)` because
  each side weights by *its own* dealbreakers. Show each user their own number.

### Stage 3 — Ranking boosts

Applied after scoring, to order the deck:

- **+15** if the candidate already liked you (converts to a match instantly on
  your right-swipe — the single strongest engagement lever).
- **+10** active in the last 48h; **−15** inactive for 14+ days.
- **+5** for profile completeness (photos + bio + verified email).
- Small deterministic jitter so the deck isn't identical between sessions.

### Stage 4 — Explain the score ← *the differentiator*

Never show a bare "87%". Generate 2–3 reasons and 1 caution from the largest
agreements and largest gaps:

> **87% match**
> ✓ You're both night owls
> ✓ Similar cleanliness standards
> ✓ Budgets overlap at $700–850
> ⚠ They have a cat

This is pure string templating off the vector — no LLM needed — and it's what
makes people trust the ranking. It also gives the demo its best 10 seconds.

### Deck generation

Fetch a candidate pool (200) → hard-filter → score → sort → take 20 → prefetch
images. Refill when 5 cards remain. Cache the queue so a reload doesn't reshuffle.

---

## 6. Architecture decisions

### Backend: Supabase (decided)

**Supabase.** Postgres means the compatibility query, geo
filtering, and "who liked me" are all just SQL; Row Level Security enforces
privacy (e.g. `address_exact` only readable by matched users) at the database
rather than in client code we'd have to trust; Realtime gives us chat with no
socket server; Auth and Storage are included. Appwrite is a perfectly good
alternative and is the right call *if a teammate already knows it* — the
difference isn't worth a learning-curve tax. What matters more than the choice:
**pick one this week and stop having a backend-shaped hole.**

Either way:
- No secrets in the client bundle. Anon/public keys only; anything requiring a
  service key or an LLM API key goes in an Edge Function.
- Wrap the SDK behind `src/lib/api/*.ts` so components never import it directly.
  Swapping backends then costs one folder, not the whole app.

### Frontend

- **Keep Ionic + Capacitor.** Mobile-first is right for this product, and
  Capacitor gives a real Android build for the demo.
- **Swipe deck: use `react-tinder-card`** — it's already a dependency, handles
  mouse *and* touch, and replaces the broken hand-rolled gesture code outright.
  If it fights us on overlay/rotation polish, fall back to
  `@use-gesture/react` + `framer-motion`. Do not keep hand-rolling touch events.
- **Accessibility is not optional here.** A swipe-only interface excludes anyone
  using a keyboard, a screen reader, or switch control. Ship visible Like/Pass
  buttons under the deck and bind ←/→ from day one. It's also just faster on
  desktop, which is where judges will look at it.
- **State:** TanStack Query for server state, React Context for session. No Redux.
- **Forms:** all Ionic components. `HouseListings.tsx` currently uses raw HTML
  inputs, which is why it looks pasted-in.
- Standardise on `fetch` via one `src/lib/api/client.ts`; drop `axios`.

### Design system

✅ Done. `theme/variables.css` has the palette, radii, and shadow tokens;
`Card.css`/`Card.tsx` use them for the swipe deck. Dark mode inherits for free
via `dark.system.css` — no extra work needed per-component as long as
components stay on `--ion-color-*` vars instead of hardcoded hex.

### Integrations — current and planned

Every integration decision here defaults to **free tier, no vendor lock-in
beyond Supabase**, per the constraint set at project kickoff.

| Integration | Status | Notes |
|---|---|---|
| Supabase (Postgres, Auth, Storage, Realtime) | ✅ Live | The only backend. Free tier: 500MB DB, 1GB storage, 50k monthly active users — plenty for a demo/small launch. |
| Institutional email verification | Not started (Phase 1) | No third-party service needed — Supabase Auth's own email-confirmation flow, gated by a domain allow-list checked in a Postgres trigger or at signup time (`.edu`, `@conestogac.on.ca`, etc.). Zero new integrations. |
| Push notifications | Not started (Phase 4) | Capacitor's local/push notification plugin + a free tier of Firebase Cloud Messaging (Android) / APNs (iOS) — no paid service required. |
| Maps / geocoding (commute-time filtering) | Not started (Phase 5 stretch) | Needed only for `max_commute_minutes` beyond straight-line distance. Free options: OpenStreetMap + Nominatim (geocoding) and OSRM (routing) self-hosted or public demo server — avoids a Google Maps API key/billing account. Decide only when Phase 5 is actually reached. |
| LLM (match explanations, listing normalisation, icebreakers) | Not started (§8, optional layer) | Templated explanations (§5 stage 4) already cover the core value **with zero API cost**. If added later, must go through a server-side Supabase Edge Function — never a client-side key. Model choice deferred; not a blocker for anything in Phase 1–4. |

No other integrations are planned. Payments, SMS, and listing-scraper
integrations are explicitly out of scope (§2).

---

## 7. Trust, safety & fairness

Two things here are genuinely important, not box-ticking.

### Safety (people are meeting strangers about housing)

- **Institutional email verification** (`.edu`, `@conestogac.on.ca`, etc.) as a
  visible badge. Cheap to build, enormous for trust, and it fits the student
  audience exactly.
- **Exact addresses stay private until a match.** Show neighbourhood + a map
  circle, not a pin. Enforce it in RLS, not in the UI.
- **Report / block** on every profile and in every chat, from the first release.
- **In-app chat only** until users choose otherwise — no phone numbers on profiles.
- **Scam warning in the chat header**: student rental markets are full of
  "e-transfer the deposit and I'll mail you the keys" fraud. A persistent
  "never send a deposit before viewing in person" banner costs nothing and is the
  kind of detail that reads as a real product.

### Fairness — reconsider the current filter set

`RoommateFinder.tsx` currently filters on **gender, nationality, and relationship
status**. Three separate problems:

1. **Nationality as a free-text exact-match filter is useless.** "Canadian" vs
   "canadian" vs "Canada" never match. It doesn't predict living compatibility
   either — sleep schedule and cleanliness do. **Cut it.** If the intent was
   shared language or food/kitchen culture, model *those* directly.
2. **Gender needs care.** Selecting a housemate's gender for shared living space
   is a legitimate and widely-supported preference, and human rights legislation
   generally recognises shared-accommodation situations differently from
   ordinary rental housing. But the rules differ by jurisdiction and are
   narrower than people assume — in Ontario the shared-accommodation exemption is
   written around sharing a kitchen or bathroom with the *owner or their family*,
   which is not every situation this app will host. **Before launch, get this
   checked** against the Ontario Human Rights Code and the Residential Tenancies
   Act rather than trusting this document. Practical design in the meantime:
   offer gender preference as an **opt-in filter on person-to-person matching**,
   with inclusive options (`women` / `men` / `non-binary` / `no preference`,
   multi-select), and **do not apply it to landlord-posted listings**, where the
   exemption is far weaker. Never expose it as a filter someone else's listing
   uses to exclude applicants.
3. **Relationship status** predicts nothing about being a good housemate. Cut it;
   "do you plan to have a partner staying over often?" is the question actually
   being asked, and it belongs in `guest_frequency`.

Net: the filters become **budget, location, move-in date, lifestyle vector,
dealbreakers** — better matching *and* a much smaller legal surface. This is a
genuine product improvement, not a compliance tax.

### Privacy

Age is shown, birthdate is not. Precise coordinates are never returned to the
client for unmatched users — round to ~1km. Ship an account deletion path;
"delete my profile" is a reasonable thing for a user to want and trivial now,
painful later.

---

## 8. Where AI genuinely helps (and where it doesn't)

The existing `PersonalityAnalysis.tsx` name suggests an LLM ambition. Redirect it:

**Worth building:**
- **Match explanations in natural language.** Templated reasons (§5, stage 4)
  cover 90% of it for free; an LLM can make the top-3 matches read like a friend
  describing someone. Optional layer on top, never the source of truth.
- **Free-text → vector.** Let users write "I'm up late, I cook a lot, I hate
  mess" and pre-fill the quiz from it. Removes onboarding friction, which is the
  single biggest drop-off point in any matching app.
- **Listing normalisation.** User pastes a messy Kijiji/Facebook post they wrote;
  we extract rent, room type, availability, amenities into the structured form.
- **Icebreaker suggestions** in a new chat, drawing on the actual compatibility
  reasons.

**Not worth building:** fabricated listings (see §2), "personality types"
(Myers-Briggs-flavoured labels are not predictive and invite the app to make
claims it can't support), and LLM-driven ranking (unexplainable, slow, expensive,
and worse than the deterministic score above).

**Rule:** all model calls go through a server-side Edge Function. An API key in a
Vite bundle is a public API key.

---

## 9. Roadmap

Sized in focused working days for a small team. Phases are ordered by dependency —
each one leaves the app in a shippable state.

### Phase 0 — Unbreak the build _(half a day, do this first)_

Nothing else can be verified until `npm run build` passes.

Done (as part of the dependency upgrade — the build had to pass to verify it):

- [x] `Card.tsx` rewritten on `react-tinder-card`, broken gesture block deleted.
- [x] `PersonalityAnalysis.tsx` moved out of `src/components/` to
      `server/mock-api.cjs` — it's a Node script, not client code.
- [x] Dead `getInitialState()` removed from `Tab1.tsx`; missing `key` prop added.
- [x] `npm run build`, `lint`, `typecheck` and `test.unit` all pass.
- [x] **CI added** (`.github/workflows/ci.yml`): `npm ci` → `lint` → `typecheck`
      → `test.unit` → `build`, on every PR and every push to `main`. This is what
      would have caught the original breakage.

- [x] `IonPage` un-nested in `RoommateFinder` — a component rendered inside a
      page must not render its own page.
- [x] `cypress/e2e/test.cy.ts` rewritten against markup that actually exists
      (it asserted `'Tab 1 page'`, long gone). Still not in CI — see below.
- [x] `routes.js` deleted (merged from PR #1): it referenced an undefined `app`,
      had no imports or exports, hardcoded `YOUR_API_KEY`, and called OpenAI's
      retired `text-davinci-003` endpoint. It was also the fabricated-listings
      feature §2 argues against.
- [x] App identity fixed: real `appId`, stray backslash removed from `appName`
      in both `capacitor.config.ts` and `ionic.config.json`, real `<title>`, and
      a `manifest.json` that no longer points at two icon files that don't exist.
- [x] README written.

- [x] E2E job added to CI (`cypress-io/github-action@v6`, runs against
      `npm run dev`), verified 3/3 passing both locally and in CI.

Still open:

- [ ] Settle the product name (§13.5), then update `appId`/`appName` before
      generating a native project — the Android package name is painful to change
      once an `android/` project exists.

**Exit:** green CI, app builds, one honest placeholder screen. ✅

#### Dependency pins worth knowing about

The toolchain is otherwise on latest. Three things are deliberately held back,
and all three are documented in `package.json` under `"comments"`:

| Package | Held at | Why |
|---|---|---|
| `react-router` / `react-router-dom` | 5.x | `@ionic/react-router` peer-requires `^5.0.1`. v6/v7 is impossible while Ionic's router is in use — moving would mean dropping `@ionic/react-router` entirely. |
| `typescript` | 6.0.3 | `typescript-eslint` hard-errors on TS 7.0 (upstream issue #10940 tracks TS ≥7.1). TS 7 works fine for `tsc` alone; it's linting that breaks. Revisit once typescript-eslint ships support. |
| `react-tinder-card` | 1.6.4 (last release) | Its declared peers are stale (React ≤18, react-spring ^9). Both work on React 19 / react-spring 10; `overrides` in `package.json` accept the newer versions. If it ever breaks, `@use-gesture/react` + `framer-motion` is the fallback named in §6. |

### Phase 1 — Foundation _(2–3 days)_

Already done: design system, Supabase project + schema + RLS, `ExploreContainer`
deleted. Tab **labels** already renamed; routes and Matches/Chat tabs are not.
Remaining work, in dependency order:

**1. Typed API layer — `src/lib/api/`**
Nothing should import `src/lib/supabase.ts` directly except this folder.
- `src/lib/api/client.ts` — re-exports the existing `supabase` singleton.
- `src/lib/api/auth.ts` — `signUp`, `signIn`, `signOut`, `getSession`,
  `onAuthStateChange` wrapper.
- `src/lib/api/profile.ts` — CRUD for `profiles` + `lifestyle` + `housing_intent`.
- One file per entity as later phases need it (`listings.ts`, `swipes.ts`, etc.)
  — don't pre-create empty files for entities Phase 1 doesn't touch.

**2. Route rework**
Replace `/tab1` `/tab2` `/tab3` with `/discover` `/listings` `/matches`
`/profile` (tab shell) + `/onboarding` and `/chat/:matchId` (pushed, outside
the tab shell) per §3's IA. Rename `Tab1.tsx`→`DiscoverPage.tsx` etc. — do
this in the same PR as the route change so file name and route stay aligned,
not as a later cleanup.

**3. Auth**
- Email + password via `supabase.auth.signUp` / `signInWithPassword`.
- On first sign-in, insert a bare `profiles` row (id = auth user id) — this is
  what makes `/onboarding` vs `/discover` the routing decision (no row yet →
  onboarding; row exists but `lifestyle` incomplete → resume onboarding; both
  exist → discover).
- Institutional email verification: Supabase's built-in email-confirmation
  link, plus a domain allow-list check (`.edu`, `@conestogac.on.ca`, etc.) at
  signup — sets `profiles.verified_email`. No new integration (see §6).
- Magic link is a nice-to-have, not a blocker — password auth alone is enough
  to exit Phase 1.

**4. Onboarding quiz → `lifestyle` + `housing_intent`**
Concretely, the ~12 questions and the exact column each fills:

| # | Question (user-facing) | Writes to |
|---|---|---|
| 1 | "What's your living situation right now?" (has a place / needs a place / forming a group) | `housing_intent.role` |
| 2 | Budget range slider | `housing_intent.budget_min/max` |
| 3 | Move-in window (two date pickers) | `housing_intent.move_in_earliest/latest` |
| 4 | City + neighbourhoods multi-select | `housing_intent.city`, `neighbourhoods[]` |
| 5 | "Where do you need to be close to?" (campus/work address → geocoded) | `housing_intent.anchor_lat/lng`, `max_commute_minutes` |
| 6 | Sleep schedule slider | `lifestyle.sleep_schedule` |
| 7 | Cleanliness slider | `lifestyle.cleanliness` |
| 8 | Noise tolerance slider | `lifestyle.noise_tolerance` |
| 9 | Guest frequency slider | `lifestyle.guest_frequency` |
| 10 | Sociability slider | `lifestyle.sociability` |
| 11 | Smoking / cannabis / drinking / pets (one screen, four selects) | `lifestyle.smoking/cannabis/drinking/pets_owned/pets_ok_with` |
| 12 | "Any dealbreakers?" — pick up to 3 from the above list | `lifestyle.dealbreakers[]` |

Progress bar (12 steps), resumable (each answer saves on step-advance, not
just at the end — a user closing the tab mid-quiz shouldn't lose progress),
skippable-with-nag (banner on `/discover` until `lifestyle` + `housing_intent`
both exist, since the deck is meaningless without them).

**5. Profile view/edit**
Display + edit everything from onboarding, plus photo upload to Supabase
Storage (bucket per user, `photos[]` stores storage keys not public URLs —
resolve to signed/public URL at render time).

**6. Seed script**
30–40 realistic fake profiles + lifestyle + housing_intent rows, inserted
directly via the Supabase SQL editor or a one-off script using the
`service_role` key (server-side only, never shipped to the client). **Do this
early** — an empty matching app is impossible to develop against or demo, and
it's what makes Phase 2's deck testable at all.

**Exit:** you can sign up, get routed through onboarding, land on a real
`/discover` route, and see seeded profiles (not placeholder stock cards).

### Phase 2 — The core loop _(3–4 days) ← the product_

- `src/lib/matching.ts`: hard filters + scoring + explanations, pure functions.
- Unit tests for it. This is the highest-value test surface in the codebase:
  pure in, pure out, and every ranking bug lives here.
- Deck: card stack, drag with rotation, LIKE/NOPE overlays, buttons, keyboard,
  undo-last-swipe, empty state, skeleton loaders.
- Profile detail sheet on tap: photos, bio, the compatibility breakdown.
- Swipe persistence + mutual-match detection + the match celebration moment.
- Matches list and realtime 1:1 chat.
- **7-day match expiry** with a nudge at day 5. Dead matches are the main way
  matching apps rot; expiry keeps the list honest.

**Exit:** two accounts can match and talk. This is a complete, demoable product.

### Phase 3 — Listings _(2–3 days)_

- Post a listing: multi-step Ionic form, photo upload, availability, amenities.
- Listing card in the deck (visually distinct from person cards) + browse/filter
  list view.
- Listing detail: gallery, map circle (exact address only after match), current
  occupants, "message the poster".
- Deck mode toggle: People / Rooms / Both.

### Phase 4 — Trust & polish _(2–3 days)_

- Report/block end-to-end, incl. deck-level filtering.
- Push notifications via Capacitor for match + message.
- Empty/error/offline states everywhere; retry.
- Analytics on the funnel (§11).
- Cypress e2e for the critical path: sign up → quiz → swipe → match → message.
- Android build through Capacitor; PWA install prompt.
- Accessibility pass: labels, focus order, contrast, screen-reader deck usage.

### Phase 5 — Stretch, in value order

1. **Group forming** — 3+ people match as a household and hunt together. The
   biggest genuine differentiator; nothing mainstream does this well.
2. **Commute-time filtering** to campus/work, not straight-line distance.
3. AI match blurbs + free-text onboarding (§8).
4. Map view of listings.
5. Roommate agreement generator (chores, quiet hours, guests) post-match.
6. Verified reviews from previous housemates — powerful, and a moderation
   problem; only with real capacity behind it.

### If the deadline is a weekend demo

Cut to: **Phase 0 → seed data → Phase 2 deck + scoring + explanations → fake
"match!" moment → one static chat screen.** Skip auth (hardcode a session), skip
listings, skip the backend entirely and run the matching engine client-side over
the seed JSON. That's a demo that shows the *idea* working, and it's ~1.5 days.
The scoring function you write for it is the same one that ships later.

---

## 10. Backlog

| # | Task | Size | Depends on | Status |
|---|---|---|---|---|
| 1 | Fix `Card.tsx` via `react-tinder-card` | S | — | ✅ |
| 2 | Remove Express server from `src/components/` | XS | — | ✅ |
| 3 | CI workflow (lint + typecheck + build + unit + e2e) | S | — | ✅ |
| 4 | App identity, README, manifest | S | — | ✅ |
| 5 | Fix broken Cypress spec | XS | — | ✅ |
| 6 | Tab/route rework to Discover/Listings/Matches/Profile | M | 1 | 🟡 labels only, routes still `/tab1-3` |
| 7 | Design system + theme variables | M | — | ✅ |
| 8 | Supabase project + schema + RLS | M | — | ✅ |
| 9 | Typed API layer `src/lib/api/` | M | 8 | ❌ next up |
| 10 | Auth + institutional email verification | M | 8 | ❌ |
| 11 | Onboarding quiz → lifestyle vector | L | 9 | ❌ |
| 12 | Profile view/edit + photo upload | M | 9 | ❌ |
| 13 | Seed data script (30–40 profiles) | S | 8 | ❌ |
| 14 | `matching.ts` — filters, scoring, explanations | L | — | ❌ |
| 15 | Unit tests for matching | M | 14 | ❌ |
| 16 | Swipe deck UI (+ buttons, keyboard, undo) | L | 1, 7 | 🟡 deck stacking done, no keyboard/buttons/undo/real data |
| 17 | Swipe persistence + mutual match detection | M | 9, 16 | ❌ |
| 18 | Matches list | S | 17 | ❌ |
| 19 | Realtime chat | L | 17 | ❌ |
| 20 | Match expiry + nudges | S | 17 | ❌ |
| 21 | Post-a-listing form | L | 9 | ❌ |
| 22 | Listing cards in deck + browse view | M | 21 | ❌ |
| 23 | Report / block | M | 9 | ❌ |
| 24 | Push notifications (Capacitor) | M | 19 | ❌ |
| 25 | E2E happy path | M | 19 | 🟡 basic smoke spec exists, not the full critical path |
| 26 | Accessibility pass | M | 16 | ❌ |
| 27 | Android build + PWA | M | Phase 4 | ❌ |

---

## 11. Success metrics

Instrument these from Phase 2 — they tell you whether the *matching* works, not
just whether the app runs:

- **Onboarding completion rate** (start quiz → finish). Expect the biggest drop here.
- **Swipes per session** and **like rate** (a like rate above ~60% means the deck
  isn't filtered tightly enough; below ~10% means it's over-filtered or the pool
  is too small).
- **Match rate** = matches / likes.
- **Conversation rate** = matches with ≥1 message. The number that actually
  matters — matches nobody talks to are vanity.
- **Time to first message** after a match.
- Self-reported outcome: "did you find a roommate?" prompt after 30 days.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| **Cold start** — a matching app with 20 users is useless | Launch to one campus, one term, at once. Seed with real listings scraped-by-hand *with permission*. Don't launch city-wide. |
| Fairness/legal exposure on gender & nationality filters | §7 — cut nationality, opt-in gender on person-matching only, get jurisdiction-specific review before launch. |
| Safety incident | Verification, private addresses, report/block, in-app chat, scam banner — all in the first release, not "later". |
| Scope creep across four half-built spikes | Phase 0 exists to close the spikes. Do not start Phase 3 before Phase 2 is done. |
| Backend indecision (the empty `appwrite/` folder) | Decide this week; the API-layer wrapper keeps the cost of being wrong low. |
| Seasonality — student housing demand is spiky | Time launches to Jan/May/Sep lease cycles. |

---

## 13. Open questions

1. **Scope of the launch market** — one campus (Conestoga? Waterloo region?) or
   city-wide? Affects cold-start strategy more than any technical decision here.
2. ~~**Backend**: Supabase or Appwrite?~~ **Decided and live.** Schema + RLS
   policies in `supabase/schema.sql`, applied to a real project; typed client
   in `src/lib/supabase.ts`; `.env.local` populated and verified reachable.
   Remaining: the `src/lib/api/` wrapper layer (§9 Phase 1, item 1) — nothing
   should import `supabase.ts` directly outside that folder.
3. **Deadline**: is there a demo date driving this, or is it an open-ended
   rebuild? Determines whether we take the weekend-cut path in §9.
4. **Team size and split** — the phases parallelise cleanly as
   design-system + matching engine + backend/schema if there are three people.
5. **Name.** "Hackville2025" isn't shippable. Worth 20 minutes before Phase 1,
   since it lands in the app id, the domain, and the manifest.

---

_Last updated: 2026-07-30. This document tracks the plan, not the
implementation. Update it when a phase completes or a decision in §6/§13 gets
made. Current position: Phase 0 done, Phase 1 partially done (design system +
backend live; auth/routes/onboarding/seed data are the remaining work, in that
dependency order per §9)._
