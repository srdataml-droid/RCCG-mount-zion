# Mount Zion Website — Product Spec v2
*Feature statuses current as of 2026-08-03.*

## 1. Product Vision
A single, honest, low-maintenance website for RCCG Mount Zion (Lower
Hutt, Wellington, NZ). Public church page first — no login, everyone
can browse and submit forms. Admin page second — login required,
built after the public site is solid. Both are now built; deployment is
the remaining step.

**Non-goals, permanent:**
- No multi-parish support — single parish, forever, not phase-limited
- No AI assistant of any kind
- No public login/register — only the admin page has login
- Bank transfer for giving, not Stripe/card processing

## 2. Feature Matrix

| Feature | Status |
|---|---|
| Church info (name, pastor, address, service times) | ✅ Done, DB-backed (church_info table) |
| Departments (name, description, how-to-join) | ✅ Done, DB-backed, no leader names |
| Connect Card | ✅ Done |
| Meeting request (plain form) | ✅ Done, no AI |
| Testimonies (submit + moderated display) | ✅ Done, schema ready |
| Events (list) | ✅ Done, schema ready, empty until real events added |
| Watch Live (Facebook link-out) | ✅ Done |
| Nav (5 dropdown sections) + gold/white/black theme | ✅ Done |
| Give page (bank transfer details) | ✅ Done, DB-backed (giving_accounts table), one account per category |
| Admin page (Supabase Auth login) | ✅ Done — seven sections, see §10 |
| Events calendar view (Calendar/List toggle) | ✅ Done |
| Light/dark mode | ✅ Done, public and admin |
| PostHog analytics | ✅ Done, behind env vars |
| Deployment | ⬜ Pending — the main remaining item, see §11 |
| Prayer Request, Baptism, expanded Connect Card, Ministry pages | ⬜ Backlog, undecided priority |
| Counseling services | 🚫 Parked — real/staffed vs. aspirational undecided |

## 3. User Journeys

**First-time visitor**: homepage → service times/address → Connect Card or Plan Your Visit.

**Meeting request**: plain form (name, contact, preferred time, reason) → saved to `meeting_requests` → reviewed in the admin Requests section, which shows every submitted field in a detail dialog.

**Testimony**: submit → moderation queue (`isApproved = false`) → visible once approved via admin page.

**Admin**: Supabase Auth login → manage events, departments, testimonies, requests, giving accounts, and church details — all without touching code.

## 4. Information Architecture

Single-page site, anchor-scroll nav, not multi-route:

```
Home
About      ▾ Departments · Testimonies
Connect    ▾ Connect Card · Meeting Request
Events     ▾ Events List · Calendar View
Give       (modal — bank transfer details per giving category)

/admin (separate, login-required, not in public nav)
```

## 5. Database Schema

| Table | Key fields |
|---|---|
| `church_info` | id, name, tagline, pastorName, pastorTitle, address, city, state, phone, email, facebook_url, liveStreamEmbedId, liveStreamUrl, isLiveNow, serviceTimes (jsonb), accentColor, logoText |
| `events` | id, title, description, date, endDate (nullable), time, location, category, bannerUrl |
| `giving_accounts` | id, category (unique, one of the six), bankName, accountName, accountNumber |
| `testimonies` | id, authorName, title, content, date, likes, isApproved |
| `connect_cards` | id, fullName, email, phone, isFirstTime, prayerRequest, interestInGroups (jsonb), submittedAt |
| `meeting_requests` | id, fullName, contact, preferredDateTime, reason, submittedAt |
| `departments` | id, name, description, howToJoin |

No `parishId` on any table — permanently single-parish, one row in
`church_info`. RLS enabled on every table. Express server (service
role) is the only direct database client.

## 6. API Specification

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/church-info` | Fetch the one church_info row (polled every 45s for live status) |
| GET | `/api/events` | List events |
| GET | `/api/departments` | List departments |
| GET | `/api/giving-accounts` | List bank accounts by giving category |
| GET | `/api/testimonies` | List approved testimonies (max six) |
| POST | `/api/testimonies` | Submit testimony (enters moderation) |
| POST | `/api/testimonies/:id/like` | Atomic like increment |
| POST | `/api/connect-cards` | Submit Connect Card |
| POST | `/api/meeting-requests` | Submit meeting request (plain form) |

**Admin routes** — all under `/api/admin/*`, all behind a `requireAdmin`
Supabase Auth session check:

| Resource | Methods |
|---|---|
| `church-info` | GET, PATCH |
| `events` | GET, POST, PUT, DELETE |
| `departments` | GET, POST, PUT, DELETE |
| `giving-accounts` | GET, POST, PUT, DELETE |
| `testimonies` | GET, PATCH (approve/unapprove), DELETE |
| `meeting-requests` | GET, DELETE |
| `connect-cards` | GET, DELETE |

## 7. Frontend

- React 19 + TypeScript + Vite 6 + Tailwind 4
- Key components: `App.tsx`, `ConnectCard.tsx`, `MeetingRequestForm.tsx`,
  `GivingModal.tsx`, `EventsCalendar.tsx`, `ThemeToggle.tsx`
- `src/main.tsx` picks between the public `App` and `AdminApp` on a plain
  `/admin` pathname check — no routing library, since the public site is a
  single anchor-scroll page
- Light and dark mode throughout, public and admin
- PostHog analytics in `analytics.ts`, behind env vars, tracking page views
  and a few button events — never form contents or personal data
- No PastorBot, no ParishConfigurator/Novaxis sidebar — both removed
- Data fetched from Supabase via the API at runtime — nothing
  content-related is hardcoded in the frontend

## 8. Backend

- Express (`server.ts`), Supabase client via service role key
- Every DB call wrapped in try/catch with safe fallback
- No chat/AI routes of any kind

## 9. Payments

Bank transfer — account details + reference format displayed on the
Give page. No Stripe, no card processing. If NZ donation tax-credit
receipts are ever wanted, confirm Charities Services/IRD donee status
first — that's a registration question, not a code question.

## 10. Admin Access

Built. Reached by typing `/admin` directly — it is not in the public nav.
Login via Supabase Auth, accounts created manually (no public sign-up).
`src/admin/AdminApp.tsx` is the whole admin; it is self-contained and
creates its own Supabase client.

Seven sections: **Events**, **Departments**, **Testimonies** (approve /
unapprove, six public maximum), **Requests** (Connect Cards and Meeting
Requests, searchable by name, sortable, with a full-detail dialog),
**Giving accounts**, **Church details** (including the Go Live / End Live
control and the per-broadcast live video URL), and **Account** (change the
admin email or password).

Still undecided: who holds the account — a tech volunteer, Pastor Hannah,
or both.

## 11. Deployment (not yet executed)

- Frontend: Vercel or Netlify (free tier)
- Backend: Node-capable free host, provider still TBD
- Env vars (Supabase URL/service key) configured in the host, never
  committed
