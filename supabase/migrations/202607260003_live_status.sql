alter table public.church_info
  add column if not exists "isLiveNow" boolean not null default false;
