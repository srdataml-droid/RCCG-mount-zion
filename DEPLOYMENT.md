# Deploying the Mount Zion website

## What is being deployed

One Node application, not two. `server.ts` runs Express, serves every
`/api/*` route, and — when `NODE_ENV=production` — also serves the built
front end out of `dist/`. A static host such as Netlify, or Vercel's static
output, would serve the pages but return 404 for every API route, so the
church information, events, departments, giving accounts, and all four forms
would fail. It must go on a host that runs Node.

The plan below uses **Render's free tier**, which matches the project's $0
budget decision. Its one real drawback is covered under
[Cold starts](#cold-starts).

## Before deploying

1. **Run every migration.** In the Supabase SQL editor, run each file in
   `supabase/migrations/` in filename order:

   | File | Adds |
   |---|---|
   | `202607190001_initial_parish_data.sql` | All tables, RLS, seed data |
   | `202607260001_event_ranges.sql` | `events.endDate` |
   | `202607260002_contact_email.sql` | Contact email field |
   | `202607260003_live_status.sql` | `church_info.isLiveNow` |
   | `202607260004_giving_accounts.sql` | `giving_accounts` table |
   | `202607270001_live_stream_url.sql` | `church_info.liveStreamUrl` |
   | `202607270002_remove_pastor_image.sql` | Drops the unused photo column |

   Several are known to be outstanding — the project status notes record at
   least `202607260004` as not yet applied. Re-running them is safe: every
   statement is written with `if not exists` / `on conflict do nothing`.

2. **Create the admin user.** In Supabase, Authentication → Users → Add user.
   There is no public sign-up, so this is the only way an account exists.
   Copy that user's UUID — it becomes `ADMIN_USER_ID`.

3. **Check the build locally.** `npm run lint && npm run build` should both
   pass before pushing.

## Render setup

Create a new **Web Service** pointed at the GitHub repository, then set:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Instance type | Free |

### Environment variables

Set all of these in Render's dashboard before the first deploy. `.env` is
git-ignored and never reaches the host.

| Variable | Notes |
|---|---|
| `SUPABASE_URL` | Server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side, secret — never expose as a `VITE_` variable |
| `ADMIN_USER_ID` | The UUID from step 2. **Every admin route returns 503 until this is set** |
| `VITE_SUPABASE_URL` | Read at build time |
| `VITE_SUPABASE_ANON_KEY` | Read at build time |
| `SITE_URL` | The service's public URL, no trailing slash |
| `NODE_ENV` | `production` |
| `VITE_POSTHOG_KEY` | Optional. Omit both and the analytics library is dropped from the bundle entirely |
| `VITE_POSTHOG_HOST` | Optional |

`PORT` is injected by Render; the server reads it and falls back to 3000
only for local development.

**The `VITE_` variables are read when the bundle is built, not when the
server starts.** Adding or changing one requires a fresh deploy, not just a
restart. This is the most common way for the admin login to arrive broken —
if `VITE_SUPABASE_URL` was missing at build time, `/admin` shows "Admin setup
required" no matter what the runtime environment says.

### SITE_URL and the first deploy

`SITE_URL` drives `/robots.txt`, `/sitemap.xml`, and the `canonical` and
`og:url` tags. The first two are generated at request time, so they pick the
value up immediately. The two meta tags are injected at build time by the
`siteUrlTags` plugin in `vite.config.ts`.

Render only assigns the URL when the service is created, so:

1. Deploy once with `SITE_URL` unset — the tags are simply omitted, which is
   correct behaviour rather than a broken value.
2. Copy the assigned `https://<name>.onrender.com` address.
3. Set `SITE_URL` to it and trigger a manual deploy so the tags are built in.

When a real domain is bought later, point it at the service, update
`SITE_URL`, and redeploy. No code changes.

## Supabase URL configuration — the localhost link trap

By default a Supabase project's **Site URL** is `http://localhost:3000`, and
every link Supabase emails is built from it. Left alone, an administrator on
the deployed site requests an email change, receives the confirmation mail,
clicks it, and is sent to a page on their own machine that isn't running —
the change never completes and nothing explains why.

The application now passes an explicit `emailRedirectTo` of
`<current origin>/admin`, but Supabase only honours a redirect that is on the
allow-list. Both halves are required. In the Supabase dashboard, under
**Authentication → URL Configuration**:

| Field | Value |
|---|---|
| Site URL | The deployed address, e.g. `https://rccg-mount-zion.onrender.com` |
| Redirect URLs | `https://rccg-mount-zion.onrender.com/admin` — add `http://localhost:3000/admin` as a second entry if email flows are tested locally |

This is dashboard-only configuration; the service role key cannot change it,
so it will not travel with the code and must be done once per project — and
again if the site moves to a real domain.

Also worth knowing: **Authentication → Providers → Email** has a *Secure email
change* setting, on by default, which sends a confirmation link to both the
old and the new address. Both must be clicked. If the old mailbox is no longer
reachable, either turn that off first or change the address with the admin
API instead, which applies it directly with no email at all.

## After deploying

Check each of these against the live URL:

- `/` loads with the church name, service times, and departments — if this
  shows the "unable to load church information" notice, the server cannot
  reach Supabase
- `/robots.txt` disallows `/admin` and names the sitemap
- `/sitemap.xml` returns XML rather than a 404 (a 404 means `SITE_URL` is
  unset)
- `/admin` shows the login form, and the admin account can sign in
- Once signed in, each of the seven sections loads without an error banner
- Submit one Connect Card from the public site and confirm it appears under
  Requests
- Request an email change and confirm the link in the message points at the
  deployed site rather than localhost

Then enter the real content through the admin panel: the giving account
details for each category, the church email address, and the actual events.

## Cold starts

A free Render service sleeps after about 15 minutes without traffic, and the
next request waits roughly 50 seconds while it wakes. For a church site, the
visitor most likely to hit that is someone checking service times on a Sunday
morning.

Three ways to handle it, in order of cost:

1. **Accept it.** The cost is one slow load for the first visitor in a while.
2. **Ping it.** A free uptime monitor hitting the site every 10 minutes keeps
   it awake. Render's free tier has a monthly instance-hour limit, so a
   constant ping can exhaust it before month end — check the current
   allowance before relying on this.
3. **Pay.** Render's cheapest paid instance is around US$7/month and never
   sleeps. This is the only option that is genuinely always fast, and it
   breaks the $0 budget decision.

## Search engine registration

Once the site is live and `SITE_URL` is set, submit
`https://<your-site>/sitemap.xml` to Google Search Console. This is the step
that gets the church found by someone searching "RCCG Lower Hutt". It is
worth redoing after any move to a real domain.
