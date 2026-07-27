create table if not exists public.giving_accounts (
  id text primary key,
  category text not null unique check (category in ('Tithe', 'Offering', 'Thanksgiving', 'Building Fund', 'Missions', 'Other')),
  "bankName" text not null,
  "accountName" text not null,
  "accountNumber" text not null
);

alter table public.giving_accounts enable row level security;

-- Preserve the existing Tithe/OPay details before removing the old flat
-- fields. The conditional block also makes this safe for databases where the
-- old columns were already removed during a previous manual deployment.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'church_info' and column_name = 'bankName'
  ) then
    insert into public.giving_accounts (id, category, "bankName", "accountName", "accountNumber")
    select 'giving-tithe', 'Tithe', "bankName", "bankAccountName", "bankAccountNumber"
    from public.church_info
    where coalesce("bankName", '') <> ''
       or coalesce("bankAccountName", '') <> ''
       or coalesce("bankAccountNumber", '') <> ''
    on conflict (id) do nothing;
  end if;
end;
$$;

alter table public.church_info drop column if exists "bankName";
alter table public.church_info drop column if exists "bankAccountName";
alter table public.church_info drop column if exists "bankAccountNumber";
