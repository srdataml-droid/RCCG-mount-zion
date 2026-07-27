# Prompt for Codex — Events calendar refinements

Two changes to the EventsCalendar.tsx just built:

---

## 1. Show one week at a time, Sunday–Saturday, not a continuous scroll

Currently it's a continuous horizontal strip covering ~6 weeks at 
once. Change it to show exactly ONE week (7 columns: Sun, Mon, Tue, 
Wed, Thu, Fri, Sat) at a time.

```
- Add "Previous week" / "Next week" navigation (simple arrow buttons, 
  one on each side of the week row, or a small nav bar above it)
- Tapping "Next" moves the view forward to the following Sun–Sat week; 
  "Previous" moves back
- Default view on page load: the week containing today's date
- Event bars still render the same way (spanning across the days they 
  cover), just constrained to whichever 7-day window is currently shown
- If an event's range extends beyond the visible week, the bar should 
  still show partially (e.g. starting mid-week and continuing to the 
  right edge, implying it continues into the next week) — don't just 
  hide events that spill outside the current window
```

## 2. Add a Calendar/List view switch, right next to each other

Currently there's just the calendar timeline. Add a simple toggle — 
two buttons or tabs, e.g. "Calendar" and "List", positioned together 
near the "Events" heading.

```
- Tapping "Calendar" shows the EventsCalendar timeline (with the 
  weekly Sun–Sat view from #1 above)
- Tapping "List" shows a simple flat list of events instead (title, 
  date/date range, time, location — similar to how events were shown 
  before the calendar was built, or reuse whatever simple list 
  rendering already exists elsewhere in the codebase if there's 
  something close)
- Keep the currently-selected view highlighted/active state visually 
  obvious (e.g. active tab in gold, inactive in muted stone), same 
  general button style as the rest of the site
- Both views read from the same events data — this is purely a 
  display toggle, not two different data sources
```

Test on mobile width specifically — this is a phone-first audience, 
confirm the week navigation and view toggle both work cleanly with 
touch, not just mouse clicks.

Append outcome to mount-zion-project-status.md as usual.
