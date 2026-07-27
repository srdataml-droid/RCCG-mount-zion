# Mount Zion Website — Product Spec v2

## 1. Product Vision
A single, honest, low-maintenance website for RCCG Mount Zion (Lower
Hutt, Wellington, NZ). Public church page first — no login, everyone
can browse and submit forms. Admin page second — login required,
built after the public site is solid.

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
| Give page (bank transfer details) | ⬜ Pending — currently placeholder text |
| Admin page (Supabase Auth login) | ⬜ Pending — after Give page |
| Prayer Request, Baptism, expanded Connect Card, Ministry pages, calendar view | ⬜ Backlog, undecided priority |
| Counseling services | 🚫 Parked — real/staffed vs. aspirational undecided |

## 3. User Journeys

**First-time visitor**: homepage → service times/address → Connect Card or Plan Your Visit.

**Meeting request**: plain form (name, contact, preferred time, reason) → saved to `meeting_requests` → Pastor Hannah reviews manually via admin page (once built) or Supabase directly (until then).

**Testimony**: submit → moderation queue (`isApproved = false`) → visible once approved via admin page.

**Admin** (once Phase built): Supabase Auth login → manage events, departments, testimonies, meeting requests, church_info — all without touching code.

## 4. Information Architecture

Single-page site, anchor-scroll nav, not multi-route:

```
Home
About      ▾ Departments · Testimonies
Connect    ▾ Connect Card · Meeting Request
Events     ▾ Events List · Calendar View (planned)
Give       (bank transfer details, pending real content)

/admin (separate, login-required, not in public nav)
```

## 5. Database Schema

| Table | Key fields |
|---|---|
| `church_info` | id, name, tagline, pastorName, pastorTitle, address, city, state, phone, email, facebook_url, liveStreamEmbedId, serviceTimes (jsonb), accentColor, logoText |
| `events` | id, title, description, date, time, location, category, bannerUrl |
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
| GET | `/api/church-info` | Fetch the one church_info row |
| GET | `/api/events` | List events |
| GET | `/api/departments` | List departments |
| GET | `/api/testimonies` | List approved testimonies |
| POST | `/api/testimonies` | Submit testimony (enters moderation) |
| POST | `/api/testimonies/:id/like` | Atomic like increment |
| POST | `/api/connect-cards` | Submit Connect Card |
| POST | `/api/meeting-requests` | Submit meeting request (plain form) |

**Admin routes** (Phase pending): add/edit/delete on events and
departments, approve/reject testimonies, view meeting requests, edit
church_info — all behind Supabase Auth session check.

## 7. Frontend

- React + TypeScript + Vite + Tailwind
- Key components: `App.tsx`, `ConnectCard.tsx`, `MeetingRequestForm.tsx`,
  `GivingModal.tsx`
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

## 10. Admin Access (pending)

Login via Supabase Auth, accounts created manually (no public
sign-up). Lets an authorized person (tech volunteer, and/or Pastor
Hannah — still undecided who) manage events, departments, testimonies,
and meeting requests without touching code.

## 11. Deployment (not yet executed)

- Frontend: Vercel or Netlify (free tier)
- Backend: Node-capable free host, provider still TBD
- Env vars (Supabase URL/service key) configured in the host, never
  committed
