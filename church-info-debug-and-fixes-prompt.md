# Prompt for Codex — Church Info debugging, testimony cap confirmation, double-submit fix

---

## 1. Church Details tab still broken — full diagnostic needed

The GET /api/admin/church-info fix may not have fully resolved it, or 
a different issue exists now. Don't just patch symptoms — check the 
whole flow end to end:

```
1. Confirm GET /api/admin/church-info actually exists, is gated behind 
   requireAdmin, and returns the full church_info row as JSON (test 
   with a real authenticated request, not just reading the code).

2. Confirm the response shape EXACTLY matches the ChurchInfo type in 
   types.ts — specifically check the newer fields (bankName, 
   bankAccountName, bankAccountNumber) actually exist as columns in 
   the live Supabase table (the migration adding them may not have 
   been run yet — check this specifically) and are included in the 
   SELECT.

3. Confirm serviceTimes (jsonb) round-trips correctly — fetched as a 
   real array, not a stringified JSON blob that breaks 
   JSON.stringify(data.serviceTimes) in AdminApp.tsx's ChurchPanel.

4. Open the browser console and Network tab while loading the Church 
   Details tab, capture the ACTUAL error and response body, and fix 
   based on what's really happening rather than assuming.

5. Test the full save flow too (PATCH), not just the load (GET) — 
   confirm editing and saving a field actually persists and reloads 
   correctly.

Report back exactly what was actually broken and what fixed it.
```

## 2. Testimony cap — confirm it's actually enforced at 6

```
Re-confirm the testimony cap logic (from the earlier prompt) is 
actually implemented and working: max 6 publicly visible 
(isApproved = true) testimonies at a time, oldest one automatically 
un-approved when a 7th is approved. Test this directly — approve 7 
testimonies via the admin panel and confirm only the 6 most recent 
stay visible on the public Testimonies section, with the 7th oldest 
dropping off (un-approved, still visible/recoverable in the admin 
Testimonies tab, not deleted).
```

## 3. Fix double-submission — multiple taps create duplicate entries

```
Real bug: tapping "Add event" (and likely "Add department", and any 
other admin add/create button, plus public forms like Connect Card, 
Meeting Request, and testimony submission) multiple times quickly — 
common on mobile, or on a slow connection — creates multiple duplicate 
entries, since there's no guard against a second submit while the 
first request is still in flight.

Fix: for every form's submit handler, disable the submit button (and/
or ignore additional submit events) while a request is already in 
progress, re-enabling it only once the request completes (success or 
error). Apply this consistently across:
- Admin: Add/Save Event, Add/Save Department
- Public: Connect Card, Meeting Request form, testimony submission

This is a real data-integrity bug (duplicate events/entries), not 
cosmetic — treat it as a priority fix.
```

Append outcome to mount-zion-project-status.md as usual.
