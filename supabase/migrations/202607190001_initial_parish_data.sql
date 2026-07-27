-- Persistent data for RCCG Mount Zion. Single-parish, permanently.
-- No parishId, no slug, no multi-tenant shape anywhere. Column names
-- intentionally match the existing TypeScript/API camelCase fields.

create table if not exists public.church_info (
  id text primary key,
  name text not null,
  tagline text not null,
  "pastorName" text not null,
  "pastorTitle" text not null,
  address text not null,
  city text not null,
  state text not null,
  phone text not null,
  email text not null,
  "facebook_url" text not null,
  "liveStreamEmbedId" text not null,
  "serviceTimes" jsonb not null,
  "accentColor" text not null,
  "logoText" text not null,
  "isLiveNow" boolean not null default false
);

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null,
  "date" date not null,
  "endDate" date,
  "time" text not null,
  location text not null,
  category text not null check (category in ('Special', 'Weekly', 'Youth', 'Women', 'Men', 'Prayer')),
  "bannerUrl" text not null
);

create index if not exists events_date_idx on public.events ("date");

create table if not exists public.testimonies (
  id text primary key,
  "authorName" text not null,
  title text not null,
  content text not null,
  "date" date not null,
  likes integer not null default 0 check (likes >= 0),
  "isApproved" boolean not null default false
);

create index if not exists testimonies_public_wall_idx
  on public.testimonies ("isApproved", likes desc);

create table if not exists public.connect_cards (
  id text primary key,
  "fullName" text not null,
  email text not null,
  phone text not null,
  "isFirstTime" boolean not null,
  "prayerRequest" text not null,
  "interestInGroups" jsonb not null,
  "submittedAt" timestamptz not null
);

create index if not exists connect_cards_submitted_idx
  on public.connect_cards ("submittedAt" desc);

create table if not exists public.meeting_requests (
  id text primary key,
  "fullName" text not null,
  contact text not null,
  "preferredDateTime" text not null,
  reason text not null,
  "submittedAt" timestamptz not null
);

create index if not exists meeting_requests_submitted_idx
  on public.meeting_requests ("submittedAt" desc);

create table if not exists public.departments (
  id text primary key,
  name text not null,
  description text not null,
  "howToJoin" text not null
);

create index if not exists departments_name_idx on public.departments (name);

-- The service-role-backed Express server is the sole database client.
alter table public.church_info enable row level security;
alter table public.events enable row level security;
alter table public.testimonies enable row level security;
alter table public.connect_cards enable row level security;
alter table public.meeting_requests enable row level security;
alter table public.departments enable row level security;

create or replace function public.increment_testimony_likes(testimony_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_likes integer;
begin
  update public.testimonies
  set likes = likes + 1
  where id = testimony_id
  returning likes into updated_likes;

  return updated_likes;
end;
$$;

revoke all on function public.increment_testimony_likes(text) from public;
grant execute on function public.increment_testimony_likes(text) to service_role;

-- Seed the one and only parish row.
insert into public.church_info (
  id, name, tagline, "pastorName", "pastorTitle",
  address, city, state, phone, email, "facebook_url", "liveStreamEmbedId",
  "serviceTimes", "accentColor", "logoText"
) values (
  'parish-1',
  'RCCG Mount Zion',
  'A House of Faith in the Heart of Wellington',
  'Hannah Adeniran',
  'Assistant Pastor',
  '550 High Street',
  'Lower Hutt',
  'Wellington 5018',
  '+64 27 393 5187',
  '',
  'https://www.facebook.com/rccgmountzionwellington',
  '',
  '[{"day":"Sunday","time":"10:00 AM","name":"Sunday Service"},{"day":"Tuesday","time":"06:00 PM","name":"Digging Deep"},{"day":"Thursday","time":"06:00 PM","name":"Faith Clinic"}]'::jsonb,
  'indigo',
  'Mount Zion'
)
on conflict (id) do nothing;

insert into public.departments (id, name, description, "howToJoin") values
  ('dept-choir', 'Choir', 'Supporting worship through song and music.', 'Complete a connect card and tell the team you would like to serve in music.'),
  ('dept-usher', 'Usher', 'Helping every visitor feel seen, comfortable and at home.', 'Complete a connect card and let us know you are interested in welcoming people.'),
  ('dept-media', 'Media & Technical Team', 'Supporting sound, projection, livestream and digital communication.', 'Complete a connect card and select the media or technical team as your area of interest.'),
  ('dept-prayer', 'Prayer Ministry', 'Praying faithfully for the church, community and the needs entrusted to us.', 'Send a connect card or speak with the team after a service to learn more.'),
  ('dept-children', 'Children''s Ministry', 'Creating a safe, joyful space where children can learn and grow in faith.', 'Complete a connect card and tell the team you would like to hear about serving with children.')
on conflict (id) do nothing;
-- Bank transfer giving details — editable via admin, no card processor.
alter table public.church_info add column if not exists "bankName" text not null default '';
alter table public.church_info add column if not exists "bankAccountName" text not null default '';
alter table public.church_info add column if not exists "bankAccountNumber" text not null default '';

update public.church_info set
  phone = '07061313517',
  "bankName" = 'OPay',
  "bankAccountName" = 'Irenikase Samuel Temitope',
  "bankAccountNumber" = '7061313517'
where id = 'parish-1';
