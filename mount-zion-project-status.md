# Mount Zion Website — Project Status
*Current as of 2026-08-03. The dated sections further down are the running
history, newest first; this opening section describes the app as it stands
today.*

## What this project is
Google AI Studio (Gemini) generated a full React + TypeScript + Express app
called `rccg-parish-portal`. It was originally built as a **multi-tenant**
demo (multiple sample parishes). It is now permanently locked to a single,
real parish: **RCCG Mount Zion, Lower Hutt, Wellington, NZ**. There is no
`parishId` on any table and no multi-parish code path left.

## Current tech stack
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind 4
- **Backend**: Express (`server.ts` at the repository root, ~548 lines)
- **AI features**: none. PastorBot and the Gemini/Ollama routes were removed
  on 2026-07-23 and this is a permanent product decision, not a deferral.
- **Data storage**: Supabase (Postgres), RLS enabled on every table. The
  Express server holds the service-role key and is the only direct database
  client. Seven migrations live in `supabase/migrations/`.
- **Auth**: Supabase Auth on `/admin` only, accounts created manually. No
  public sign-up anywhere on the site.
- **Payments**: bank transfer only — a `giving_accounts` table, one account
  per giving category. No Stripe, no card processing.
- **Analytics**: PostHog, behind `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST`.
- **Hosting**: still not deployed anywhere. This is the main open item.

## What's real vs. placeholder right now

| Item | Status |
|---|---|
| Parish name, address, service times | ✅ Real (Mount Zion, 550 High Street, Lower Hutt) |
| Pastor name/title | ✅ Real (Assistant Pastor Hannah Adeniran) |
| Pastor photo | ➖ Field removed entirely on 2026-07-27 — the site no longer has one |
| Phone | ✅ Real (+64 27 393 5187) |
| Email | 🔲 Seeded blank — still needs a real address |
| Live stream link | ✅ Permanent `facebook_url` page link, plus a per-broadcast `liveStreamUrl` used only while `isLiveNow` is true |
| Events | 🔲 Empty — schema and admin CRUD ready, awaiting real events |
| Testimonies | 🔲 Empty — moderated, max six public at a time (FIFO) |
| Departments | ⚠️ Five DB-backed departments with no leader names. Whether these are Mount Zion's actual departments is still unconfirmed with the church |
| Giving | ✅ Bank transfer, category-based, editable in admin. Real account details still need entering |
| Database | ✅ Supabase, persistent, RLS on every table |
| Admin panel | ✅ Built — `src/admin/AdminApp.tsx`, seven sections |

## Decisions made so far
- **Location**: Lower Hutt, Wellington, New Zealand
- **Scope**: single parish, permanently — not a phase limitation
- **Payments**: bank transfer, deliberately not Stripe or Paystack
- **No AI of any kind** in the product
- **Budget**: $0 — free tiers throughout (Supabase, Vercel/Netlify)

## Two features discussed, not yet built
1. **Facebook Page Plugin embed** — shows the church's Facebook posts/events
   live on the site. Free, no API key, no backend involvement — pure embed.
2. **Share buttons** — lets visitors share events/testimonies out to
   WhatsApp, Facebook, etc. Free, pure frontend, uses the Web Share API
   with link-based fallbacks.

Both are architecturally "safe" additions — they don't touch the database
or add any backend load.

## The biggest open item: deployment
The app is feature-complete for a first launch, builds cleanly, and is now
prepared for deployment — but has never actually been deployed. The decision
is a single Render free-tier Node service, since the Express server serves
the built front end itself. `DEPLOYMENT.md` has the full runbook; what
remains is creating the Render service, setting the environment variables,
and working through the post-deploy checklist.

## Who holds admin access
The single admin account is the church-owned address
**rccgmountzionwellton@gmail.com**, Supabase Auth UUID
`81f89d5d-2615-42ab-8696-4582cb786824`. `ADMIN_USER_ID` must equal that
UUID or every admin route returns 403 "Not authorized".

Access is keyed to the UUID rather than the email precisely so the address
can change at handover without touching configuration — an administrator can
update their own email in the Account section and stay signed in. Moved off a
personal address on 2026-08-03 so the account survives any future handover to
another volunteer.

## Data protection — verified 2026-08-03
Someone changing the church's bank account number without admin access was
tested directly and is not possible. Every table has RLS enabled and **no
policies defined at all**, which denies the `anon` and `authenticated` roles
everything; only the service-role key, held server-side, can read or write.

Probed with the anon key that ships in the browser bundle, and again as a
signed-in non-admin user created for the test:

| Attempt | Result |
|---|---|
| Read giving accounts | no rows |
| Change an account number | no rows affected |
| Delete a giving account | no rows affected |
| Read connect cards / meeting requests | no rows |
| Edit church details | no rows affected |

Account numbers were confirmed byte-identical afterwards. The service-role
key was also confirmed absent from every built client asset.

One caution when testing this: PostgREST returns `204 No Content` for an
update that matched zero rows exactly as it does for a successful one, so a
204 is not evidence of a write. Use `Prefer: return=representation` and check
whether any rows come back.

The single remaining path to the account numbers is the service-role key
itself plus the admin password — which is why both belong in host
environment variables and a password manager, never in the repository.

## Accent colour
The button gold is **`#8a6714`**, with `#6f5110` for hover. It was darkened
from `#b8942b` on 2026-08-03 because white text on the lighter gold measured
2.87:1, well under the 4.5:1 minimum for readable text; the darker tone gives
5.21:1 and keeps the white lettering. Any new gold button should use
`#8a6714`, not the older value.

`#b8942b` is still correct for gold *icons* and borders, where no text
contrast requirement applies. On dark surfaces, gold text should be
`#f2d267` — `#8a6714` on a dark card measures only 3.36:1.

## Known gaps and loose ends
- **Migrations pending in production.** Several entries below record
  migrations that must be run by hand in the Supabase SQL Editor before the
  matching features work against the live database. Confirm the full set of
  seven has been applied before launch.
- **Orphaned admin files.** `src/admin/AdminDashboard.tsx`,
  `src/admin/AdminLogin.tsx`, and `src/admin/supabaseClient.ts` are an
  earlier, simpler admin implementation. Nothing imports them —
  `src/main.tsx` mounts `AdminApp`, which is self-contained. They still
  compile, so `tsc` does not flag them, and reading them gives a misleading
  picture of the admin (no Giving panel, meeting requests only). They should
  be deleted.
- **`motion` is an unused dependency.** Nothing in `src/` imports it, so it
  is already absent from the bundle, but it can be dropped from
  `package.json` to shrink installs.
- **`.env` still holds `OLLAMA_API_KEY`**, left over from the removed
  PastorBot. Harmless but dead — worth deleting from the local file.
- **The public phone number is Nigerian**, not New Zealand:
  `church_info.phone` is `07061313517`, an 0706 mobile prefix, where the seed
  migration had `+64 27 393 5187`. A Lower Hutt congregation is publishing a
  number local visitors cannot dial. Needs correcting in admin → Church
  details.
- **The admin address may carry a typo** — `rccgmountzionwellton` rather than
  `wellington`. The church's own Facebook URL spells it `wellington`, which
  suggests the shorter form was unintended. The mailbox is real and confirmed
  so nothing is broken; if a correctly spelled address is registered, the
  admin email can be changed again with no code or configuration impact.
- **Supabase Site URL must be set before launch.** It defaults to
  `http://localhost:3000`, and every emailed link is built from it, so
  confirmation mails from the deployed site point at the administrator's own
  machine. See the URL configuration section of `DEPLOYMENT.md`.
- **`accentColor` is seeded `'indigo'`** while the site's visual system is
  gold/white/charcoal. Worth checking whether the field is used at all.
- **Dark mode is applied by blanket overrides, which is fragile.**
  `index.css:27-30` recolour `text-stone-*` and `text-red-*` globally under
  `.dark`, with no regard for what is behind them. Any element given a
  hardcoded light background therefore receives near-white text on a light
  surface. The known instances are fixed, but the pattern will keep producing
  the bug: adding `bg-white` to a component silently breaks its text in dark
  mode. Scoping those overrides, or dropping them in favour of explicit
  `dark:` variants, would remove the trap.
- **Three of the six calendar event-chip colours still fail contrast** with
  their white bold labels: `#b8942b` at 2.87:1, `#c58f2b` at 2.86:1, and
  `#a37c19` at 3.85:1, against a 4.5:1 minimum. The other three pass. Fixing
  this means rebalancing the whole six-colour palette so the categories stay
  distinguishable, which is a design decision rather than a swap, so it was
  left alone when the button gold was corrected.
- **Admin screen sizes were checked down to 555px only**, Chrome's minimum
  window width. Below that is untested; phones at 375px are the real target.

## Suggested order from here
1. Confirm all seven migrations have been run in the live Supabase project
2. Enter the real giving account details and church email via admin
3. Confirm the real department list with the church
4. Delete the three orphaned admin files
5. Deploy — follow `DEPLOYMENT.md`

## Recent changes

- 2026-08-03: Deployment preparation. Fixed the hardcoded port in `server.ts`,
  which would have broken the deploy on any host that assigns one. Split the
  admin panel into a lazily-loaded chunk and made PostHog a dynamic import,
  cutting the public bundle from 465 kB to 233 kB (148 kB to 71 kB gzipped)
  and clearing the 500 kB build warning. Added `SITE_URL`, which now drives
  runtime `robots.txt` and `sitemap.xml` routes plus build-time canonical and
  `og:url` tags; `robots.txt` disallows `/admin`. Added the missing
  `ADMIN_USER_ID` to `.env.example` and removed the unused AI Studio
  `APP_URL`. Pinned Node to >=20. Wrote `DEPLOYMENT.md` and rewrote spec §11,
  which had prescribed a static frontend plus separate backend — that split
  would have 404'd every API route, since the Express server serves `dist/`
  itself. Verified live: the port override, both new routes, and the injected
  canonical tag. `npm run lint` and `npm run build` pass.

- 2026-08-03: Removed `src/server.ts`, a stale 393-line copy of the backend
  left behind when the live server moved to the repository root. `package.json`
  runs and bundles only the root `server.ts`, and nothing referenced the copy.
  Refreshed the opening section of this document, which still described the
  pre-Supabase, PastorBot-era app, and corrected the feature matrix in
  `mount-zion-product-spec-v2.md`, which listed the Give page and admin panel
  as pending although both are built and database-backed. Recorded the
  orphaned `AdminDashboard.tsx` / `AdminLogin.tsx` / `supabaseClient.ts` files
  as a known gap. No behaviour changed; `npm run lint` passes.

- Removed the unused pastor profile-photo field from the church schema, TypeScript model, admin panels, server update payload, seed data, and documentation. The new `202607270002_remove_pastor_image.sql` migration drops the existing database column. `npm run lint` and `npm run build` pass; the repository search is clean apart from the required drop statement inside that migration.

- Added `liveStreamUrl` to the ChurchInfo contract and the `202607270001_live_stream_url.sql` migration. Church Details now has a Live video URL field beside Go Live/End Live; the public Facebook watch button uses that URL only while `isLiveNow` is true, otherwise it falls back to the permanent Facebook page.
- Added the Account tab with email-confirmation and password-change forms using Supabase Auth. Password updates require at least six characters and both forms show clear completion/failure feedback.
- Pastor photographs were temporarily made configurable in the admin panel; this was later superseded by the decision to remove that unused field entirely.
- Verification on 2026-07-27: `npm run lint` and `npm run build` pass. The live-stream migration must be applied in the Supabase SQL Editor before a live URL can be saved in the configured production database.

- Fixed the Church Details save contract: the admin panel now sends the full supported church record, reports `Saved`, `No changes to save`, or a useful `Save failed — …` message, and the PATCH route returns the church object in the shape the panel expects. Full Supabase errors are logged server-side and the safe database message is returned to the administrator.
- Added a category-based `giving_accounts` design: a migration creates the RLS-protected table, migrates the existing OPay account to Tithe, and drops the legacy flat bank columns. Public and admin APIs plus a dedicated admin Giving accounts panel support listing, creating, editing, and deleting accounts; the Give modal selects the matching account or shows a graceful setup message.
- Cleaned the public Contact card to phone, email, and a new-tab Facebook link, and strengthened dark-mode text/input contrast across public and admin views.
- Verification on 2026-07-26: TypeScript and production builds pass. A real no-op Supabase church update succeeded with the complete supported payload. The configured Supabase project has **not yet run** `202607260004_giving_accounts.sql` (`PGRST205`, table absent), so that migration must be run in the Supabase SQL Editor before the new giving-account endpoints can work in production.

- Replaced the server's in-memory parish, event, testimony, and connect-card
  storage with Supabase queries, with a migration that creates the persistent
  tables, indexes, RLS protection, and an atomic testimony-like function. The
  existing Mount Zion parish configuration is seeded without overwriting later
  edits.
- Added persistent `meeting_requests` storage and changed PastorBot into a
  meeting-request assistant for Assistant Pastor Hannah Adeniran. It now uses
  Ollama Cloud (`nemotron-3-ultra:cloud`) rather than Gemini and collects a
  visitor's name, contact method, preferred date/time, and meeting reason for
  manual pastorate review.
- Added Supabase and Ollama environment-variable placeholders to `.env.example`.
  The Supabase migration must still be run in the project's Supabase SQL Editor,
  and real `OLLAMA_API_KEY`/Supabase values must be configured before launch.
- Giving/payments, Facebook Live, and department data remain intentionally
  unchanged. Meeting requests can be reviewed in Supabase for now; an admin-desk
  view for them has not yet been added.

## 2026-07-23 — Public-site simplification and production code pass

- Rebuilt the public interface as a Mount Zion church site with a responsive
  gold/white/charcoal visual system, church imagery, and five top-level
  navigation areas: Home, About, Connect, Events, and Give.
- Removed the PastorBot/Ollama flow and its `/api/counsel` route. Meeting
  requests now use a plain form posting directly to `POST /api/meeting-requests`.
  The removed `PastorBot.tsx` file and `OLLAMA_API_KEY` example are gone.
- Removed the Novaxis SaaS sidebar and its component. Testimony submissions now
  correctly state that they are reviewed before public display; the footer is
  now RCCG Mount Zion © 2026.
- Repaired the corrupted `ConnectCard.tsx` and replaced its Nigeria-specific
  content with local Mount Zion wording. The previous duplicate department data,
  leader names, meeting times, and invented ministry personnel were removed.
- Added a DB-backed `departments` schema and seed data (name, description,
  howToJoin), with RLS enabled. The app loads departments through
  `GET /api/departments`; `parishData.ts` is no longer a live department source.
- Removed Nigeria/Naira/Lagos/Paystack/Novaxis/Ollama remnants from active
  source, updated Lower Hutt coordinates to 41.2117° S, 174.9009° E, and made
  the deferred giving UI generic NZD-ready wording.
- Removed unauthenticated admin/data-management routes that would have exposed
  parish edits, event edits/deletes, unapproved testimonies, connect-card data,
  and giving records to the public. These operations will be reintroduced behind
  Supabase Auth with the Phase 8 admin page. Public submission endpoints now
  whitelist and validate their accepted fields.
- `npm run lint` and `npm run build` pass. The Supabase migration has not been
  executed here because dashboard credentials are not present; live API and
  database verification remain pending that one operational step. The requested
  local dev-server runtime check could not be completed in the sandbox because
  its IPC socket is blocked; it requires the approved unrestricted local run.

## 2026-07-24 — Single-parish API alignment and live verification

- Aligned active code with the already-run single-parish migration: the old
  `parishes` table is no longer queried, `parishId` has been removed from all
  active types, API filters, and frontend submissions, and the livestream URL
  now uses the exact `facebook_url` database column.
- Replaced the obsolete list-style `GET /api/parishes` route with
  `GET /api/church-info`. It returns the one Mount Zion record, accurately
  reflecting the permanent single-parish model.
- Started the local server with the configured environment and verified live
  Supabase responses for church information, events, departments, and approved
  testimonies. Church info and all five seeded departments loaded successfully;
  events and approved testimonies correctly returned empty arrays.
- Verified that invalid requests to `POST /api/testimonies`,
  `/api/connect-cards`, and `/api/meeting-requests` are rejected with HTTP 400
  before any database write. `npm run lint` and `npm run build` pass.
- Removed the unused `src/data/parishData.ts` duplicate seed file. The SQL
  migration supplies initial data and the public site reads church information,
  departments, events, and testimonies from the API/database at runtime.

## 2026-07-26 — Event calendar ranges and testimony moderation cap

- Added optional event end dates throughout the active event model, protected
  admin API routes, and Mount Zion admin event form. Single-day events remain
  supported by leaving the end date blank.
- Added `supabase/migrations/202607260001_event_ranges.sql` for the live
  database. It adds the nullable `events.endDate` column; this migration must
  be run in the Supabase SQL Editor before administrators save ranged events.
- Added a mobile-friendly six-week, horizontally scrollable event timeline to
  the public Events section. Event bars span their date ranges and open a
  focused details modal with the banner, description, dates, time, location,
  and category. The existing event-card list remains below it.
- Public testimonies are now explicitly limited to six. Approving a seventh
  testimony automatically unapproves the oldest approved record (date, then
  ID), leaving it available for recovery in the admin panel. Administrators
  can now manually unapprove any published testimony as well as delete it.
- Repaired stale entrypoint/type import paths discovered during verification.
  `npm run lint` and `npm run build` both pass.

## 2026-07-26 — Contact, theme, and calendar refinements

- Added `202607260002_contact_email.sql`, which sets the temporary Mount Zion
  contact email to `samuelirenikase@gmail.com`. The public Contact section now
  displays both the configured phone number and email address.
- Confirmed Church Details already exposes phone, email, bank name, account
  name, and account number as editable fields. Added the missing authenticated
  `GET /api/admin/church-info` route used by that tab, so it now receives JSON
  rather than the SPA HTML fallback.
- Added a persistent light/dark preference to public and signed-in admin
  navigation. First visit follows the device preference; later visits use the
  saved preference. Updated core public sections, event details, forms, giving
  modal, and admin cards for dark-mode readability.
- Refined the public event calendar into a one-week Sunday–Saturday display
  with previous/next controls. Range bars are continuous single lines clipped
  precisely to the visible week edges when an event continues beyond it.
  Added a highlighted Calendar/List switch using the same event data.
- `npm run lint` and `npm run build` pass.

## 2026-07-26 — Church Details diagnostic and duplicate-submit protection

- Verified against live Supabase (read-only service-role query) that the
  `church_info` row includes `bankName`, `bankAccountName`, and
  `bankAccountNumber`, and that `serviceTimes` is returned as a JSON array.
  This matches the `ChurchInfo` type used by the admin form.
- Reproduced the original HTML-fallback symptom against a stale local dev
  server, then restarted it with the current source. The protected
  `GET /api/admin/church-info` route now responds with JSON `401 Not
  authenticated` without a token, confirming the route is registered and
  correctly gated by `requireAdmin` rather than falling through to Vite.
- Found and fixed a real Church Details save-flow mismatch: PATCH returned
  `{ success, church }`, but `ChurchPanel` expects a `ChurchInfo` row. PATCH
  now returns the updated row directly, matching GET and allowing service
  times and all saved fields to round-trip correctly.
- Added ref-backed in-flight guards and disabled states to Event and
  Department add/save forms, public testimony submission, Connect Card, and
  Meeting Request, preventing rapid repeated taps from creating duplicates.
- The live admin-user session credentials were not available in the workspace,
  so a signed-in browser save and a live seven-record testimony mutation were
  not performed. The live schema and protected-route behavior were verified;
  the six-testimony FIFO implementation remains in the admin PATCH route and
  public API limit. `npm run lint` and `npm run build` pass.

## 2026-07-26 — Live status and unified request review

- Added `202607260003_live_status.sql`, which adds the non-null
  `church_info.isLiveNow` flag with a default of `false`. The public site polls
  church information every 45 seconds and displays an accessible green “Live
  now” or gray “Offline” indicator next to the Facebook watch button.
- Added a prominent Go Live / End Live control at the top of Admin Church
  Details. It saves only the live-status flag, making it quick to use at the
  start or end of a service without requiring the church-details form to be
  resubmitted.
- Renamed the admin navigation item to Requests and combined Connect Cards and
  Meeting Requests into a switchable review view. Both lists can be searched by
  submitter name and sorted by name or submission time. Connect Card rows show
  name, email, phone, first-time status, prayer request, and submission date.
- `npm run lint` passes. The live-status migration still needs to be run in the
  Supabase SQL Editor before the new admin control can be used against the live
  database.

## 2026-07-26 — Department loading, request details, and dark placeholders

- Fixed the Departments admin JSON failure by adding the missing authenticated
  `GET /api/admin/departments` route. Before the fix, an authenticated check
  returned the Vite HTML page (`200 text/html`), confirming the request was
  falling through instead of reaching Express.
- Made request names in the Requests tables interactive. Selecting a Connect
  Card or Meeting Request opens an accessible detail dialog containing every
  submitted field, with full whitespace-preserved prayer-request and meeting-
  reason text.
- Added a global dark-mode placeholder rule for inputs and textareas, so public
  and admin forms consistently use readable light placeholder text in dark
  mode.
- Restarted the local server and verified with the authorized admin account
  that `GET /api/admin/departments` now returns HTTP 200 and a JSON array.
  `npm run lint` and `npm run build` pass.

## 2026-07-26 — SEO basics and PostHog analytics

- Added a page title, meta description, Open Graph title/description/type, and
  Twitter summary metadata. Added a permissive `public/robots.txt`; a sitemap
  remains pending the production canonical URL.
- Added lazy loading, asynchronous decoding, and meaningful alt text to event
  banner images. The CSS hero image remains external and background-based.
- Added PostHog browser analytics behind `VITE_POSTHOG_KEY` and
  `VITE_POSTHOG_HOST`, with no real key committed. Page views plus Give,
  successful testimony, successful Connect Card, and Facebook-watch clicks are
  tracked without sending form content or other personal data.
- Installed `posthog-js`; `npm run lint` and `npm run build` pass. The build
  now warns that the client JavaScript bundle exceeds 500 kB after analytics is
  included, so code splitting or a deferred analytics load is a future
  performance decision.
