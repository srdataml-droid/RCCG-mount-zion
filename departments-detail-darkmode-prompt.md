# Prompt for Codex — Departments JSON bug, request detail popups, dark mode placeholder text

---

## 1. Departments tab — same "Unexpected token '<'" bug as Church Info had

```
Same root cause as the earlier Church Info bug: the frontend is 
getting back an HTML page instead of JSON, meaning a request is 
hitting no matching route. Check specifically:

- Does GET /api/admin/departments exist in server.ts, gated behind 
  requireAdmin? (The Church Info bug was caused by this GET route 
  being missing while only the save/PATCH route existed — check for 
  the exact same gap here.)
- Confirm the response shape matches what DepartmentsPanel in 
  AdminApp.tsx actually expects.
- Test with a real authenticated request, not just reading the code.
```

## 2. Connect Cards and Meeting Requests — tapping an item should open full detail

```
Currently tapping a Connect Card or Meeting Request in the admin list 
doesn't show the full text — prayerRequest (Connect Cards) and reason 
(Meeting Requests) need to be readable in full, not truncated.

Add a detail view (modal or expand-in-place, your call) that opens 
when tapping a row, showing ALL fields for that entry in full — 
especially prayerRequest and reason, which are likely the longest 
text fields and the ones currently hardest to read in a compact list.
```

## 3. Dark mode — placeholder text is unreadable

```
In dark mode, input placeholder text is showing dark/low-contrast — 
hard to read. Fix placeholder text color to be white/light in dark 
mode across every form on the site (public forms: Connect Card, 
Meeting Request, testimony submission; admin forms: all of them). 
Use Tailwind's dark:placeholder-white or similar utility consistently, 
not a one-off fix on a single input.
```

Append outcome to mount-zion-project-status.md as usual.
