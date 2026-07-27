-- A Facebook live video receives a new share URL each time. Keep it separate
-- from the permanent church page URL and allow it to be blank while offline.
alter table public.church_info
  add column if not exists "liveStreamUrl" text;
