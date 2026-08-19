-- Admin allow-list. A row here is what makes an auth user an admin.
create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(trim(name)) > 0)
);

create table beats (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  price_cents int not null,
  bpm int,
  musical_key text,
  duration_seconds int,
  cover_path text,
  preview_path text not null,
  master_mp3_path text not null,
  master_wav_path text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beats_title_not_blank check (length(trim(title)) > 0),
  constraint beats_price_positive check (price_cents > 0),
  constraint beats_bpm_sane check (bpm is null or bpm between 40 and 300),
  constraint beats_status_valid check (status in ('draft', 'published', 'sold'))
);

create table beat_categories (
  beat_id bigint not null references beats (id) on delete cascade,
  category_id bigint not null references categories (id) on delete restrict,
  primary key (beat_id, category_id)
);

-- Postgres does not index foreign keys automatically. The composite primary key
-- already covers lookups by beat_id; category_id needs its own index for the
-- catalog filter and for the ON DELETE RESTRICT check.
create index beat_categories_category_id_idx on beat_categories (category_id);

-- The storefront lists published beats newest first.
create index beats_published_created_at_idx
  on beats (created_at desc)
  where status = 'published';

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger beats_set_updated_at
  before update on beats
  for each row execute function set_updated_at();

-- The admin check lives in a private schema and is never exposed to client roles.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;

alter table admin_users enable row level security;
alter table admin_users force row level security;
alter table categories enable row level security;
alter table categories force row level security;
alter table beats enable row level security;
alter table beats force row level security;
alter table beat_categories enable row level security;
alter table beat_categories force row level security;

-- No policy on admin_users: only the SECURITY DEFINER function reads it, so RLS
-- denies every client role by default.

-- Categories are public reference data.
create policy categories_public_read on categories
  for select to anon, authenticated
  using (true);

create policy categories_admin_write on categories
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Visitors only ever see published beats.
create policy beats_public_read on beats
  for select to anon, authenticated
  using (status = 'published');

create policy beats_admin_all on beats
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy beat_categories_public_read on beat_categories
  for select to anon, authenticated
  using (
    exists (
      select 1 from beats
      where beats.id = beat_categories.beat_id
        and beats.status = 'published'
    )
  );

create policy beat_categories_admin_write on beat_categories
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
