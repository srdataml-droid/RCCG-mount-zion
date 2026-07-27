# Mount Zion — Codex Prompt Log v2

Clean restart of this log — old history archived, not repeated here.
Only active, pending work below. Mark status as items get done.

---

## START HERE — for a fresh Codex session

```
Read mount-zion-project-plan-v2.md and mount-zion-product-spec-v2.md 
first — they are the current source of truth. The codebase has 
already been verified (from an actual uploaded zip) to correctly have:
church_info table (not parishes, no slug), no parishId anywhere, 
"facebook_url" column, departments table (no leader names), 
MeetingRequestForm.tsx (plain form, no chat/AI), Novaxis sidebar gone, 
NZ cleanup done, gold/white/black theme applied, 5-section dropdown 
nav. Don't redo any of that — it's confirmed done. Work through the 
pending prompts below in order.
```

---

## 1. Give page — real bank transfer details
**Status:** ⬜ Pending

```
GivingModal.tsx currently just says "giving integration coming soon." 
Replace with real content: bank account name, account number, and a 
reference format (e.g. "TITHE-[Full Name]") for direct bank transfer. 
No Stripe, no card processor — bank transfer only, per the settled 
decision (safer feeling for givers, simpler to build).

Make the account details easy to copy (a copy-to-clipboard button on 
the account number is a nice touch, not required).

Keep it in the same gold/white/black visual style as the rest of the 
site. Append outcome to mount-zion-project-status.md.
```

## 2. Full production-readiness pass
**Status:** ⬜ Pending

```
Full pass across the whole project — not just recently-touched files:

CORRECTNESS
- Run a full production build (not just dev mode), fix anything that 
  only works in dev
- Confirm every API route actually works end to end
- No dead code/unused imports from removed features (PastorBot, 
  Ollama, ParishConfigurator/Novaxis sidebar)

SECURITY
- No secrets committed to the repo, everything via .env
- RLS confirmed enabled on every Supabase table
- All DB calls wrapped in try/catch with safe fallback behavior

GENERAL HEALTH
- App runs end to end with no console errors on any page
- Mobile-responsive basics work

Report back what was found/fixed. Append outcome to 
mount-zion-project-status.md.
```

## 3. Optional cosmetic rename
**Status:** ⬜ Pending — low priority, nothing broken

```
Purely cosmetic, not urgent: rename the `ParishConfig` TypeScript 
interface to `ChurchInfo`, and rename the `parish` variable / 
`loadParish` function in App.tsx to `church` / `loadChurchInfo`. This 
just removes the last leftover "parish" naming from the code — 
everything already works correctly either way. Only do this if/when 
there's nothing higher-priority queued.
```

## 4. Admin page (build after 1-2 above are done)
**Status:** ⬜ Pending — do not start until Give page + production pass are done

```
Build a login-required admin page, not linked from public nav:

1. Login via Supabase Auth (email/password) — do not build custom 
   auth. Accounts created manually through Supabase, no public sign-up.

2. Once logged in, admin can:
   - Add/edit/delete events
   - Add/edit/delete departments
   - View + approve/reject pending testimonies
   - View meeting requests
   - Edit church_info (phone, service times, facebook_url, tagline, etc.)

3. Every admin API route must check the Supabase session token before 
   doing anything — reject unauthorized requests cleanly.

4. The Express server remains the only thing that talks to Supabase 
   directly — admin actions go through server.ts routes like 
   everything else, just gated behind auth now.

Append outcome to mount-zion-project-status.md.
```

---

## Backlog — undecided priority, documented only

- Prayer Request form (separate from Connect Card)
- Baptism signup form
- Expanded Connect Card (address, spouse, children, visit count)
- Ministry pages (Adult/Youth/Kids) — richer than current flat Departments
- Events calendar view (month-based, not just list)

## Parked — do not build

- Counseling services — real/staffed vs. aspirational still undecided

---

*(Add new prompts below this line as they come up.)*
