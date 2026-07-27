# Mount Zion Website — Project Status
*Snapshot before the big Gemini-app rework session*

## What this project is
Google AI Studio (Gemini) generated a full React + TypeScript + Express app
called `rccg-parish-portal`. It was originally built as a **multi-tenant**
demo (multiple sample parishes). We've since locked it down to a single,
real parish: **RCCG Mount Zion, Lower Hutt, Wellington, NZ**.

## Current tech stack
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Express (`server.ts`)
- **AI feature**: "PastorBot" chat, powered by the Gemini API
- **Data storage**: ⚠️ **in-memory only** — resets every time the server
  restarts. Not yet connected to a real database.
- **Payments**: fake/placeholder — no real processor connected yet
- **Hosting**: not yet deployed anywhere

## What's real vs. placeholder right now

| Item | Status |
|---|---|
| Parish name, address, service times | ✅ Real (Mount Zion, 550 High Street, Lower Hutt) |
| Pastor name/title | ✅ Real (Assistant Pastor Hannah Adeniran) |
| Pastor photo | 🔲 Placeholder stock photo — needs a real one |
| Phone / email | 🔲 Blank — needs real contact details |
| Live stream link | ⚠️ Facebook Page URL stored in a field built for YouTube — needs a proper fix (see below) |
| Events | 🔲 Empty — sample Nigerian events were removed |
| Testimonies | 🔲 Empty — sample testimonies were removed |
| Departments | ⚠️ Still generic sample data (Choir, Ushers, Media, Prayer Band, Children's Ministry) — names/leaders are placeholders, not Mount Zion's real ones |
| Giving/payments | 🔲 Fake — needs a real processor (Stripe recommended for NZ, not Paystack) |
| Database | 🔲 Still in-memory — biggest open architectural gap |

## Decisions made so far
- **Location**: Lower Hutt, Wellington, New Zealand (not Nigeria — this
  changed our payment processor choice from Paystack to **Stripe**)
- **Scope**: single parish for now, multi-tenant code kept intact for
  possible future reuse
- **Budget**: $0 — sticking to free tiers throughout (Supabase, Vercel/Netlify,
  free Gemini API quota)
- **No Claude Code subscription** — working via copy-paste from this chat
  instead of an agentic coding tool

## Two features discussed, not yet built
1. **Facebook Page Plugin embed** — shows the church's Facebook posts/events
   live on the site. Free, no API key, no backend involvement — pure embed.
2. **Share buttons** — lets visitors share events/testimonies out to
   WhatsApp, Facebook, etc. Free, pure frontend, uses the Web Share API
   with link-based fallbacks.

Both are architecturally "safe" additions — they don't touch the database
or add any backend load, so they can be added independently of the bigger
Supabase rework.

## The biggest open item: real persistent storage
Everything currently lives in JavaScript arrays in server memory. The next
major architectural step is wiring this to **Supabase** (free tier) so
data actually survives a server restart. This is the one piece still
blocking a genuinely "live" launch.

## Files changed so far
- `src/data/parishData.ts` — rewritten for Mount Zion (real data + TODOs)

## Files not yet touched (still sample/generic)
- `src/App.tsx` (876 lines)
- `src/components/ConnectCard.tsx`
- `src/components/GivingModal.tsx`
- `src/components/ParishConfigurator.tsx`
- `src/components/PastorBot.tsx`
- `server.ts`

## One thing worth deciding with the pastor before launch
The **PastorBot** AI chat gives automated spiritual/pastoral responses.
Worth a conscious decision on tone, boundaries, and whether serious
situations (grief, crisis, self-harm mentions) should redirect to a real
human rather than continue as an AI conversation.

## Suggested order for the "whole lot of change" session
1. Decide Facebook Live: link-out button (fast) vs. full embed (more work)
2. Add Facebook Page Plugin + Share buttons (safe, isolated, quick wins)
3. Replace generic Departments with Mount Zion's real ones
4. Fill in phone/email/pastor photo
5. Wire up Supabase for real persistent storage (the big one)
6. Swap fake giving for real Stripe integration

## Recent changes

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
