<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/faf4f76c-e344-4946-8128-afb57f7fc33b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env`, then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Run the SQL migration in `supabase/migrations/202607190001_initial_parish_data.sql` using the Supabase SQL Editor.
4. Run the app:
   `npm run dev`
