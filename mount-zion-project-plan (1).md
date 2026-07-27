# Mount Zion Website — Project Plan
*RCCG Mount Zion, St Oran's College, 550 High Street, Lower Hutt, Wellington 5010, NZ*

---

## Project scope (locked)

- **Single parish**, Mount Zion only, **permanently** — the codebase
  happens to retain a multi-tenant *data shape* (parishId on every
  table) from the original scaffold, which is simply reusable
  architecture, not a plan to activate multi-parish support
- **$0 budget** — free tiers only, throughout (Supabase, hosting, email,
  all of it)
- **Stack**: React + TypeScript + Vite (frontend), Express (backend),
  Supabase (database + Auth for the future admin page). No AI assistant —
  PastorBot/Ollama has been removed entirely, replaced by a plain form
- **Currency/payments**: NZD via Stripe (not Paystack — corrected once
  location was confirmed as NZ, not Nigeria)

---

## Phase map

```
Phase 0  Foundation (AI-generated scaffold)              ✅ DONE
Phase 1  Real parish identity                            ✅ DONE
Phase 2  Persistent storage (Supabase)                   🟡 IN PROGRESS
Phase 3  AI assistant — REMOVED                          ❌ SUPERSEDED (see below)
Phase 4  Content honesty cleanup                         🟡 IN PROGRESS
Phase 5  Outreach & communication features                ⬜ NOT STARTED
Phase 6  Live stream handling                             ⬜ NOT STARTED
Phase 7  Payments (Stripe)                                 ⬜ DEFERRED
Phase 8  Admin page (login required)                       🔒 SEQUENCED AFTER PHASE 4-6
Phase 9  Deployment                                        ⬜ NOT STARTED
Phase 10 Real content fill-in                              ⬜ ONGOING (you)
```

**We are currently spanning Phases 2, 4, and the NZ/simplification
cleanup** — backend persistence is built but not yet executed, there is
no AI assistant of any kind (PastorBot/Ollama was removed entirely, not
redefined or reconnected — see Phase 3), and placeholder content is
being replaced with honest markers as real information comes in.

---

## Phase 0 — Foundation ✅
Google AI Studio (Gemini) generated the initial full-stack scaffold:
React/TS/Vite frontend, Express backend, a multi-tenant data model, and
an AI chat feature. Treated as a starting skeleton, not final code.

## Phase 1 — Real parish identity ✅
- `parishData.ts` rewritten: real name, address (corrected to include
  venue name "St Oran's College" and correct postcode 5010), pastor
  (Assistant Pastor Hannah Adeniran), real service times
- Sample Nigerian events/testimonies removed (empty, honest, not faked)
- Location confirmed as Lower Hutt, Wellington, NZ — this corrected the
  payment processor decision (Stripe, not Paystack) early, before any
  payment code was built

## Phase 2 — Persistent storage (Supabase) 🟡
- Schema proposed and approved: `parishes`, `events`, `testimonies`,
  `connect_cards` — camelCase columns matching TypeScript types directly
- Row Level Security enabled; only the Express server touches the
  database, never the browser directly
- Atomic increment function built for testimony likes (avoids race
  conditions on concurrent likes)
- **Outstanding**: migration SQL still needs to be run by hand in the
  Supabase dashboard SQL editor — not yet executed
- **Outstanding**: `meeting_requests` and `service_subscribers` tables
  proposed as additions to this same migration, pending schema review
- **Outstanding, newly identified**: `departments` needs its own DB
  table too — currently only a hardcoded array in code, which fails
  the "tech dept can change it without touching code" requirement.
  `parishData.ts` becomes a one-time seed script once this and the
  parish's core fields are confirmed to be reading from Supabase at
  runtime, not from this file directly

## Phase 3 — AI assistant — REMOVED ❌ SUPERSEDED — see below
**This entire phase has since been reversed.** PastorBot was not just
redefined, it was removed entirely, replaced by a plain form (no AI, no
chat). Kept below for history only — none of this reflects the current
plan.

<details>
<summary>Original Phase 3 (historical, no longer current)</summary>

- **Scope change**: PastorBot moved from open-ended spiritual counseling
  to a meeting-scheduling assistant for Assistant Pastor Hannah — a
  deliberate narrowing, since unsupervised AI spiritual counsel was
  flagged as worth avoiding
- **Provider swap**: Gemini API → Ollama Cloud (`nemotron-3-ultra:cloud`),
  authenticated via `OLLAMA_API_KEY`
- Collects: name, contact method, preferred date/time, reason — saves to
  `meeting_requests` for manual pastor review, does not auto-book anything

</details>

**Current state**: no AI assistant at all. The meeting request feature
is a plain form — name, contact, preferred time, reason — submitted
directly to `meeting_requests`, no conversation involved. No
`OLLAMA_API_KEY`, no Ollama dependency.

## Phase 4 — Content honesty cleanup 🟡
- **Superseded update**: originally, leader names and meeting times were
  replaced with `TO BE FILLED` markers. The current requirement goes
  further — **leader names are removed as a field entirely** (not
  placeholdered), and meeting times move to the DB-backed `departments`
  table rather than staying as a code-level placeholder
- Address corrected with venue name + postcode
- **Outstanding**: department names/descriptions still need a read-through
  to confirm they match Mount Zion's actual ministries
- **Outstanding**: pastor photo still not confirmed real vs. placeholder
- **Outstanding**: phone and email still blank

## Phase 5 — Outreach & communication features ⬜
Discussed, not yet built:
- Facebook Page Plugin embed (incoming posts/events) — pure embed, no
  backend involvement
- Share buttons on events/testimonies (outgoing) — pure frontend, Web
  Share API with link fallbacks
- Service reminder emails via Resend (free tier) — simple version first:
  one-time email with the recurring Zoom/Facebook join link on signup,
  not a recurring weekly scheduler (that's a later refinement)
- **Zoom/join links are admin-editable, not hardcoded**: add `platform`
  ('zoom'|'facebook') and `joinUrl` fields to `serviceTimes` (jsonb) on
  the `parishes` table, editable through the admin page (Phase 8) once
  it exists — or directly via Supabase in the meantime. This removes
  the earlier dependency on getting real Zoom links before building
  this — the feature can ship with empty/placeholder links and be
  filled in later by whoever manages the admin page, no code change or
  redeploy needed to update them

## Phase 6 — Live stream handling ⬜
- **Decision made**: no fake "always live" badge/embed. Replace with an
  honest, always-available "Watch us on Facebook" link-out button
- Real embedded Facebook Live (vs. link-out) deferred — would require
  either manual per-service video URL updates or full Graph API
  integration, judged not worth the complexity right now
- Reference point: even Mt. Zion Christian Church (Lake Geneva, WI — a
  large, professionally built church on a paid platform) runs its "Live
  Stream" nav item on top of plain YouTube embeds, not custom
  infrastructure — validates the link-out approach as reasonable, not
  a compromise

## Phase 7 — Payments (Stripe) ⬜ DEFERRED
Explicitly parked. Fake/placeholder giving flow stays as-is until this
phase is picked back up. Not to be touched by any other phase's work.

## Phase 8 — Admin page (with login) 🔒 SEQUENCED AFTER CHURCH PAGE
**Decision reversed**: a real admin page is wanted after all —
church page (public site) comes first, admin page is built once that's
solid. Two separate pages/sections, not two separate repos:
- **Church page**: public, no login, everyone
- **Admin page**: login required, only for the tech volunteer/pastor

**Recommendation on how to build the login itself**: use **Supabase
Auth** (email/password) rather than building custom authentication from
scratch. Supabase already provides this — sign-in, session handling,
password reset — as a ready SDK. Building auth by hand is one of the
areas most likely to introduce real security bugs if rushed; there's no
good reason to reinvent it here. The admin page itself (the actual
add/edit-event forms, etc.) is still custom-built and nicely designed —
only the login mechanism underneath borrows Supabase's existing, tested
system rather than being invented from scratch.

**What the admin page will let the tech volunteer/pastor do**, once built:
- Add/edit/delete events
- Review and approve/reject testimonies
- Review meeting requests

**Sequencing**: not started until the church-facing site (nav
restructure, visual redesign, forms, departments cleanup) is done.

## Phase 9 — Deployment ⬜
Not yet started. Planned free-tier approach:
- Frontend: Vercel or Netlify
- Backend: needs a Node-capable host (not pure static) — TBD which
  free-tier service, given the Express server requirement
- Environment variables (Supabase keys, future Stripe/Resend
  keys) need to be configured in the hosting platform, not committed to
  the repo

## Phase 10 — Real content fill-in ⬜ ONGOING
Owned by you, not a coding task:
- Confirm the pastor photo currently in use is real, not still a placeholder
- Real department descriptive text (no leader names needed — that field
  was removed entirely) and confirmation the department list matches
  Mount Zion's actual ministries
- Real phone/email
- Confirmation of correct postcode (5010 vs. 5018 discrepancy noted)
- Zoom/join links whenever convenient — no longer a blocker, since
  these are admin-editable (Phase 5/8), not hardcoded

---

## Key decisions log

| Decision | Reasoning |
|---|---|
| Single parish, not multi-tenant live | Matches actual current need; architecture kept flexible for later |
| Stripe over Paystack | Corrected once NZ location was confirmed |
| ~~PastorBot narrowed to scheduling only~~ **(historical, reversed)** | Was: avoids unsupervised AI giving spiritual/pastoral counsel. Superseded — PastorBot removed entirely, not just narrowed |
| ~~Ollama Cloud over Gemini~~ **(historical, reversed)** | Was: user preference, already using it elsewhere. Superseded — no AI provider at all now, moot |
| Link-out live stream, not embedded | Reliable, zero-maintenance, validated by how larger churches actually do it |
| `TO BE FILLED` over fake placeholder names **(partially superseded)** | Prevents fabricated info shipping to production. Still applies to phone/email/pastor photo; leader names went further and were removed as a field entirely rather than placeholdered |
| Payments explicitly deferred | Keeps scope focused; isolated enough to bolt on later without disruption |
| No admin panel or login/register surface on the site | **REVERSED** — see note below |
| Admin page WITH login, built after church page | A real, custom admin page is wanted after all — just sequenced after the public church page is solid, not built in parallel |
| Content the tech dept might change lives in the DB, not code | Departments moving from a hardcoded array to a real table for exactly this reason — general principle, applies to anything content-like going forward |
| No multi-parish activation (reversed from earlier "future" framing) | Single-parish scope is now permanent, not just a current-phase limitation |
| PastorBot removed entirely | Replaced by a plain contact/meeting form — no AI, no chat, matches "simple not complex" direction |

---

## Immediate next actions (in order)

1. Run the Supabase migration SQL by hand in the dashboard
2. Add real Supabase keys to `.env` (no Ollama key needed — that
   dependency is being removed entirely)
3. Confirm correct postcode (5010 vs 5018)
4. Remove PastorBot/Ollama, replace with a plain meeting-request form
5. New Zealand cleanup pass (remove remaining Nigeria/Paystack/Lagos
   content, fix the duplicate Departments data bug)
6. Remove the "Novaxis" sidebar
7. Simplify Departments (no placeholders, text + how-to-join dropdown),
   restructure nav into 5 dropdown sections, apply gold/white/black
   church theme
8. Build Facebook Page Plugin + Share buttons (safe, isolated)
9. Build the live-stream link-out button (Facebook)
10. Revisit Phase 5 (reminder emails) — no longer blocked on real Zoom
    links, since those are admin-editable; can build with placeholder/
    empty links from the start
11. Once the church page above is solid: build the admin page (Phase 8)
    — login via Supabase Auth, then add/edit events, review testimonies
    and meeting requests
12. Deployment planning (Phase 9)
13. Return to Phase 7 (Stripe) last
