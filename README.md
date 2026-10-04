# RCCG Mount Zion

The church website runs on Cloudflare Workers with static assets and Cloudflare D1. The public site, event/content API, and administration API are served by one Worker. Render and the old Supabase project are not required by this version.

## Local development

```sh
npm install
npm run dev
```

The Vite Cloudflare plugin runs the Worker and local D1 during development. Apply the starter migration to local D1 with `npm run db:local`.

## Production

The live Worker is `https://rccg-mount-zion.rccgmountzion03.workers.dev`. D1 migrations are in `migrations/`. Deploy with `npm run deploy`; this builds the static site and publishes the Worker. Apply later migrations using `npm run db:remote`.

Cloudflare Access protects `/admin*` and `/api/admin*`. The Access allow policy currently admits `rccgmountzion03@gmail.com`; the Worker separately verifies the signed Access JWT and email allow list. Keep the Access team domain, audience, and admin allow list in `wrangler.jsonc` aligned with the Access application in Cloudflare.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the infrastructure and content notes.
