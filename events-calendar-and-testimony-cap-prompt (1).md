# Prompt for Codex — Event calendar view + testimony cap

Two features, send images (images.jpeg, download.jpeg — AFK Arena 
calendar reference) alongside this if your Codex session supports 
image input, otherwise the description below covers it.

---

## 1. Events need a date RANGE, not just a single date

Currently `events.date` is a single date. Real events (like the 
reference images show) often run across a range — e.g. May 26 to 
June 3, not just one day.

```
1. Migration: add "endDate" (date, nullable) to the events table.
   - If endDate is null, the event is single-day (just uses "date" 
     as-is, same as today).
   - If endDate is set, the event spans from "date" to "endDate".

2. Update the Event type in types.ts to include optional endDate.

3. Update /api/events, /api/admin/events (POST/PUT), and the admin 
   EventsPanel form in AdminApp.tsx to accept/display endDate as an 
   optional field alongside the existing date field.
```

## 2. Build a real calendar/timeline view for Events

Reference: two screenshots from a mobile game (AFK Arena) showing 
event calendars. Two visual patterns worth combining:

- **Horizontal timeline/Gantt style**: a row per event, each shown as 
  a colored horizontal bar/pill starting at its start date and 
  extending to its end date, positioned along a horizontal date axis 
  (day numbers across the top). Different events get different accent 
  colors (use variations within the gold/white/black palette — e.g. 
  gold, deeper gold, stone, muted amber — not the game's rainbow 
  colors, keep it matching the site's theme).
- **Compact day-column style**: a simpler view showing days of the 
  week as columns, with event names/pills stacked underneath the days 
  they fall on.

```
Build this as a new component, e.g. EventsCalendar.tsx, added to the 
Events section of the public site (alongside or replacing the current 
flat list — your call on whether to keep both a "list view" and 
"calendar view" toggle, or just replace the list with this).

Behavior:
- Horizontal scrollable date axis (current month, or a reasonable 
  window like 4-6 weeks) 
- Each event renders as a colored bar spanning from its date to its 
  endDate (or just a single-day marker if no endDate)
- TAPPING an event opens a detail view/modal showing: title, full 
  description, date range, time, location, category, banner image if 
  set — same information already in the Event type, just presented in 
  a focused detail view rather than inline
- Keep it visually consistent with the rest of the site — gold/white/
  black theme, same fonts/spacing as other sections
- Mobile-responsive — this is a phone-first audience, the horizontal 
  scroll needs to work well with touch

Don't overbuild this into a full custom calendar library — a 
straightforward CSS grid/flex layout with date math is enough, no new 
heavy dependency needed for this.
```

---

## 3. Testimony cap — max 6, FIFO by default, pastor can override

```
Testimonies displayed publicly should be capped at 6 at a time.

Default behavior: first in, first out. When approving a testimony via 
the admin panel would bring the count of publicly visible (isApproved 
= true) testimonies above 6, automatically un-approve (or delete — 
your call, but un-approve is safer/reversible, so prefer that) the 
OLDEST approved testimony to make room, keeping the count at 6.

Override: the pastor/admin can still manually delete or un-approve any 
specific testimony at any time via the existing Testimonies tab in the 
admin panel (already built) — this FIFO behavior is just the default 
when nothing is manually curated, not a restriction on manual control.

Implement this check in the PATCH /api/admin/testimonies/:id route 
(server.ts) — after setting isApproved to true, check the total 
approved count; if over 6, find the oldest approved one (by "date" 
field, or "id" if that's more reliable for ordering) and set its 
isApproved back to false.

Test: approve a 7th testimony and confirm the oldest one automatically 
drops off the public list, while still being visible/recoverable in 
the admin Testimonies tab.
```

Append outcome to mount-zion-project-status.md as usual.
