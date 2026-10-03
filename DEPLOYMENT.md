# Cloudflare deployment

## Current setup

- Public site: https://rccg-mount-zion.samuelirenikase.workers.dev
- Hosting and API: Cloudflare Worker `rccg-mount-zion` with static assets.
- Database: Cloudflare D1 `rccg-mount-zion-db`, created in the Oceania region.
- Admin: Cloudflare Access protects `/admin*` and `/api/admin*`, currently allowing `samuelirenikase@gmail.com`. The Worker also verifies Access JWTs and checks the email allow list.
- Render and the former Supabase database were left untouched. Render can remain a fallback until the church confirms this Cloudflare version is ready to replace it.

## Deploy and database changes

Install Node.js 20 or newer and dependencies, then run:

```sh
npm install
npm run db:local
npm run dev
```

For production, `npm run deploy` builds and deploys the Worker. To apply a new migration to the production D1 database, add a numbered SQL file under `migrations/` and run `npm run db:remote`.

`wrangler.jsonc` contains the Worker name, D1 binding, public site URL, Access team domain, Access application audience, and admin email allow list. If the Worker URL or Access application changes, update the matching values there. The app is deployed to `workers.dev`; a custom domain can be added later when the church has a domain in Cloudflare.

## Content and data

The new database starts with church details, Sunday/Tuesday/Thursday service times, and five editable ministry records. No previous events, giving accounts, testimonies, or visitor submissions were available to migrate. Re-enter current event dates and giving details from the admin screen before relying on those sections. Visitor form submissions now go to D1 and are visible only in the protected admin screen.

The admin is available at `/admin`. Cloudflare Access sends a one-time email login code to the allowed admin address. Its session lasts 24 hours. The user can sign out from the admin header.

## Search and discovery

The site includes a descriptive title and summary, canonical/Open Graph URL, church structured data, `robots.txt`, and a sitemap. Submit the sitemap URL to Google Search Console once the church chooses its lasting public domain. The current `workers.dev` address is suitable for a preview but a church-owned domain is better for long-term search recognition.

## Operational notes

The site and database remain within Cloudflare's free-tier design for a small church website; check Cloudflare's current usage limits if traffic grows. D1 free-tier quota exhaustion can temporarily block data writes, so periodically export the database and keep the SQL export somewhere safe. Visitor requests contain personal details; restrict administrator access and remove old submissions when they are no longer needed.

The home cover still uses the existing image. Replace it once the church provides an approved photo or selects a suitably licensed image. The contact section and footer are present; the footer now includes navigation and visit information.
