-- Adds event ranges for installations where the initial migration has already run.
alter table public.events add column if not exists "endDate" date;

create index if not exists events_end_date_idx on public.events ("endDate");
