# Prompt for Codex — Contact email, admin field check, dark mode, calendar line behavior

---

## 1. Add real placeholder email to Contact

```
Update church_info.email to "samuelirenikase@gmail.com" (placeholder, 
same pattern as the phone number — real value, to be changed via admin 
later). Write a migration:

update public.church_info set email = 'samuelirenikase@gmail.com' 
where id = 'parish-1';

Update the Contact section in App.tsx to actually display the email 
(it currently only shows phone) — something like:
"Phone: {church.phone} · Email: {church.email} (temporary contact — 
updated by the church administrator soon)"
```

## 2. Confirm admin portal has phone, email, and bank fields editable

```
Double check: the Church Details tab in AdminApp.tsx should already 
include phone, email, bankName, bankAccountName, and 
bankAccountNumber as editable fields (this was added in an earlier 
merge from Claude). Confirm this is actually present and working — if 
it's missing or was lost in a merge, add it back. This is what lets 
the church admin change contact/bank info themselves later without 
touching code.
```

## 3. Light/dark mode toggle, whole site

```
Add a light/dark mode toggle, available on both the public site and 
the admin page.

- A toggle button (sun/moon icon) in the main nav — public site and 
  admin page both need one
- Store the preference in localStorage so it persists across visits
- Respect the user's system preference (prefers-color-scheme) as the 
  default on first visit, before they've toggled anything
- Use Tailwind's dark: variant classes throughout — don't hardcode two 
  separate stylesheets
- Keep the gold accent color consistent in both modes; only the 
  background/text base colors should flip between light (current 
  cream/white look) and dark (deep stone/black look, already used in 
  the admin login and hero sections)
- Test every section — homepage, events, testimonies, connect, give, 
  admin panel — actually looks right in both modes, not just 
  technically switches
```

## 4. Calendar event bars — one continuous straight line per event

```
Reinforcing/clarifying the calendar behavior: each event's bar must 
render as ONE continuous straight horizontal line spanning exactly 
from its start date to its end date — no visual breaks or gaps partway 
through, even if the event runs across multiple days within the 
visible week. The line should start exactly at the event's start date 
column and end exactly at its end date column, nothing more, nothing 
less.

Example: a 2-week event starting on a Sunday should draw as one 
unbroken bar starting at that Sunday and continuing in a straight line 
until the day it actually ends — not as separate disconnected segments.

If the event's range extends beyond the currently-visible Sun–Sat 
week (from the earlier weekly-view change), the bar should still 
touch/extend to the edge of the visible week to visually indicate it 
continues — not disappear or look cut off awkwardly.
```

Append outcome to mount-zion-project-status.md as usual.
