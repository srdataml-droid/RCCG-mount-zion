# RCCG Mount Zion: static-first site proposal

**Status:** Proposed for review  
**Scope:** First stable, low-cost public website; no live-service or account changes in this phase.

## Goal

Keep the church's existing visitor experience and recognizable visual style, while making the site quick to open, inexpensive to host, maintainable without a developer for routine public updates, and easier for search engines and answer engines to understand.

## Current shape

The Vite/React frontend currently waits for an Express API to fetch church information, events, ministries, testimonies, and giving accounts. Express also accepts private visitor, prayer, meeting, and testimony submissions. The admin area and these endpoints depend on Supabase. The current deployment instructions describe a Render Node service. Moving only the frontend to static hosting would break those API-backed sections and submissions.

## Proposed first version

- Build the public website as static files and host them on Cloudflare Pages' free plan. This removes the always-running Node server and its cold start. GitHub remains the source of truth for code; Pages can build and publish from the repository.
- Render church facts and public content into the generated site at build time. Use a small, explicitly public Google Sheet as the editing source for service times, events, ministries, contact details, and (if desired) giving instructions. A build step converts only approved columns into checked, typed site data. If Sheet publishing or access proves awkward, keep the same data format in repository JSON until a later decision.
- Treat the sheet and generated files as public and copyable. Never put visitor names, email addresses, phone numbers, prayer requests, credentials, or internal notes in them. Don't put service-role credentials or other secrets in browser code.
- Keep the existing calendar/list, location, church details, giving presentation, and visual identity where their data can be represented safely. Keep the requested contact section and footer. Prepare semantic, crawlable HTML with clear titles and descriptions, Church structured data, canonical URL, robots rules, sitemap, and concise question-and-answer content for common visitor questions.
- Replace the hero image when the church supplies its preferred image. Until then, leave the current image unchanged; do not select a stock image on the church's behalf.

## Private submissions and admin

Static hosting has no private database or trusted server by itself. The current custom form submissions and admin dashboard cannot be carried over unchanged without a backend. For the first static release, use ordinary email/contact links for private contact and prayer, and pause custom persistent submission flows (including testimony submission and meeting requests) until a private destination is selected. Keep only church-approved testimonies on the public site. This prevents private requests from being written to a public sheet. A separately owned private Google Form/response sheet could be considered later, after confirming who can access it and whether the visitor experience is acceptable. Defer the admin dashboard.

## Content/data recovery

The repo includes migrations and starter content, not the later live database contents. We should check whether the Supabase project is paused or still exists before assuming all content is gone. If it was deleted, rebuild the initial public content from church-approved details and information the church supplies; don't invent missing events, account numbers, or ministry details. Keep a dated export/backup of the public content source when it is set up.

## Migration and release sequence

1. Inventory every current section, endpoint, form, and data field; map what is public, private, retained, replaced, or paused.
2. Implement static data loading and build-time generation, retaining the current visitor-facing structure while adding/finalizing contact and footer details and SEO metadata.
3. Add a sample public content sheet schema and clear publishing/update steps; avoid including real private data.
4. Preview and review the build from a separate Git branch. Do not change Render, connect a production domain, or publish a replacement until the church approves the preview.
5. On approval, connect the repository to Cloudflare Pages and set the final canonical domain and Search Console sitemap. Keep the current Render deployment available until the replacement is confirmed.

## Trade-offs and later options

- Public Sheet-backed content is easy to edit but is public by design, updates on the next build rather than instantly, and should not be treated as a database for operational records.
- This first version gives up custom private form persistence and the admin panel. If those become important, add a small, authenticated backend later. A managed database with access policies (including Supabase) is the stronger next step for private requests and moderation; a sheet is not a secure substitute.
- Free static hosting avoids Render's sleeping Node process, but does not include custom domain registration. The Cloudflare Pages free plan currently documents 500 builds/month and a 20,000-file limit, comfortably above this small site.
- SEO/AEO changes improve crawlability and the clarity of answers; they cannot guarantee search placement or AI citation.

## Decisions requested before implementation

1. Approve the static-first direction and Cloudflare Pages as the proposed free host.
2. Approve a public-only Google Sheet as the preferred editing source, with repository JSON as a fallback if it makes publishing/builds unreliable.
3. Approve pausing the custom private forms and admin until a private submission destination is chosen; use contact email/phone links in the meantime.
4. Supply the replacement church hero photo when available. Confirm the public facts/content (especially contact details, service times, giving instructions, and ministries) before release.

No live service, external account, or user data is changed by this proposal.
