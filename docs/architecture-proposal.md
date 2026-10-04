# RCCG Mount Zion: static-first site proposal

**Status:** Proposed for review  
**Scope:** First stable, low-cost public website; no live-service or account changes in this phase.

## Goal

Keep the church's existing visitor experience and recognizable visual style, while making the site quick to open, inexpensive to host, maintainable without a developer for routine public updates, and easier for search engines and answer engines to understand.

## Current shape

The Vite/React frontend currently waits for an Express API to fetch church information, events, ministries, testimonies, and giving accounts. Express also accepts private visitor, prayer, meeting, and testimony submissions. The admin area and these endpoints depend on Supabase. The current deployment instructions describe a Render Node service. Moving only the frontend to static hosting would break those API-backed sections and submissions.

## Proposed first version

- Build the public website as static files and deploy it with Cloudflare Workers Static Assets. Cloudflare recommends Workers for new static sites; static assets are served without invoking the Worker, while a small Worker can handle private form submissions. This removes Render from the runtime path and avoids its sleeping Node process. GitHub remains the source of truth for code.
- Render church facts and public content into the generated site at build time. Use a small, explicitly public Google Sheet as the editing source for service times, events, ministries, contact details, and (if desired) giving instructions. A build step converts only approved columns into checked, typed site data. If Sheet publishing or access proves awkward, keep the same data format in repository JSON until a later decision.
- Treat the sheet and generated files as public and copyable. Never put visitor names, email addresses, phone numbers, prayer requests, credentials, or internal notes in them. Don't put database credentials or other secrets in browser code.
- Retain the visitor form experience by moving submissions to a small Cloudflare Worker API backed by D1. Keep private records out of the public sheet. Restrict any request review/admin route behind authenticated access; do not ship an unauthenticated endpoint that lists submissions. D1's free tier currently includes 5 million rows read/day, 100,000 rows written/day, 500 MB per database, and 7 days of point-in-time recovery. Exceeding free daily limits can cause queries to fail, so add a simple export/backup procedure before using it for ongoing requests.
- Keep the existing calendar/list, location, church details, giving presentation, and visual identity where their data can be represented safely. Keep the requested contact section and footer. Prepare semantic, crawlable HTML with clear titles and descriptions, Church structured data, canonical URL, robots rules, sitemap, and concise question-and-answer content for common visitor questions.
- Replace the hero image when the church supplies its preferred image. Until then, leave the current image unchanged; do not select a stock image on the church's behalf.

## Private submissions and admin

The public site stays static, while a Worker provides only the small API needed for form submissions and (if approved) authenticated review. Store connect cards, meeting requests, and testimony submissions in D1 with least-privilege routes. Keep public, church-approved testimonies in the generated content. Use Cloudflare Access for the review route or defer moderation tooling and use a documented private export workflow. Do not expose list/read APIs publicly. A public Google Sheet is never the destination for form submissions.

## Content/data recovery

The repo includes migrations and starter content, not the later live database contents. We should check whether the Supabase project is paused or still exists before assuming all content is gone. If it was deleted, rebuild the initial public content from church-approved details and information the church supplies; don't invent missing events, account numbers, or ministry details. Keep a dated export/backup of the public content source when it is set up.

## Migration and release sequence

1. Inventory every current section, endpoint, form, and data field; map what is public, private, retained, replaced, or paused.
2. Implement static data loading and build-time generation, retaining the current visitor-facing structure while adding/finalizing contact and footer details and SEO metadata.
3. Add a sample public content sheet schema and clear publishing/update steps; avoid including real private data.
4. Preview the built site and Worker on a separate branch using local/dev resources only. Do not connect production data or publish a replacement until the church approves the preview.
5. On approval, connect the repository to Cloudflare Workers Builds (or use the account's chosen GitHub deployment path) and set the final canonical domain and Search Console sitemap. Keep the current Render deployment available until the replacement is confirmed.

## Trade-offs and later options

- Public Sheet-backed content is easy to edit but is public by design and should not be treated as a database for operational records. Build-time import means an edit appears after a successful content build/deployment.
- Cloudflare D1 is a small relational database, not a spreadsheet. Its free limits suit a low-volume church site, but daily quota exhaustion stops queries; keep a recovery/export path and avoid storing unnecessary sensitive detail.
- Cloudflare Workers Free currently allows 100,000 Worker requests/day; static asset requests are free and unlimited. Free D1 currently has 5 million rows-read/day, 100,000 rows-written/day, 500 MB per database, and 7-day point-in-time recovery. These are limits, not a service-level guarantee.
- SEO/AEO changes improve crawlability and the clarity of answers; they cannot guarantee search placement or AI citation.

## Decisions requested before implementation

1. Approve the static-first direction and Cloudflare Workers Static Assets as the proposed host.
2. Approve a public-only Google Sheet as the preferred editing source, with repository JSON as a fallback if it makes publishing/builds unreliable.
3. Approve Cloudflare D1 for private form submissions and Cloudflare Access for any private review/admin route, keeping the existing form experience.
4. Supply the replacement church hero photo when available. Confirm the public facts/content (especially contact details, service times, giving instructions, and ministries) before release.

No live service, external account, or user data is changed by this proposal.

## Current platform references

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers pricing and limits](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
