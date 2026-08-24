-- Three things arrive together because they share the same rows: a beat is now
-- sold under one of three licences instead of at a single price, the catalogue
-- also holds services (mixing, mastering, custom work) that have no audio of
-- their own, and an order line has to remember which licence was bought.

-- 1. Catalogue -----------------------------------------------------------

alter table beats
  add column kind text not null default 'beat',
  -- Both are overrides. Null means "use the site default", which lives in
  -- license_price_cents() below and in src/lib/beats/licenses.ts; the two must
  -- be changed together.
  add column price_wav_cents int,
  -- No default for the exclusive licence: null means the buyer has to ask.
  add column price_exclusive_cents int;

alter table beats add constraint beats_kind_valid check (kind in ('beat', 'service'));

-- price_cents was the beat's only price; it is now the MP3 licence, and null
-- falls back to the site default like the WAV column does.
alter table beats alter column price_cents drop not null;
alter table beats drop constraint beats_price_positive;
alter table beats add constraint beats_prices_positive check (
  (price_cents is null or price_cents > 0)
  and (price_wav_cents is null or price_wav_cents > 0)
  and (price_exclusive_cents is null or price_exclusive_cents > 0)
);

-- A service is priced by the one price_cents column and never falls back to a
-- beat default, so it has to carry a price of its own.
alter table beats add constraint beats_service_needs_price check (
  kind <> 'service' or price_cents is not null
);

-- A service has nothing to preview and no master to deliver, so the audio
-- columns become nullable — but only for services.
alter table beats alter column preview_path drop not null;
alter table beats alter column master_mp3_path drop not null;
alter table beats add constraint beats_audio_required_for_beats check (
  kind <> 'beat' or (preview_path is not null and master_mp3_path is not null)
);

-- The storefront lists tracks and services separately, newest first.
drop index beats_published_created_at_idx;
create index beats_published_kind_created_at_idx
  on beats (kind, created_at desc)
  where status = 'published';

-- 2. Order lines ---------------------------------------------------------

-- The same beat can be ordered under two licences, so the licence joins the key.
alter table order_items add column license text not null default 'mp3';
alter table order_items alter column license drop default;
alter table order_items add constraint order_items_license_valid
  check (license in ('mp3', 'wav', 'exclusive', 'service'));

alter table order_items drop constraint order_items_pkey;
alter table order_items add primary key (order_id, beat_id, license);

-- An exclusive licence with no published price is quoted by hand, so the line
-- is recorded without one and contributes nothing to the total.
alter table order_items alter column price_cents drop not null;

alter table orders drop constraint orders_total_positive;
alter table orders add constraint orders_total_not_negative check (total_cents >= 0);

-- 3. Pricing -------------------------------------------------------------

-- Mirror of DEFAULT_LICENSE_PRICE_CENTS in src/lib/beats/licenses.ts. The
-- storefront shows the price and this function charges it; they have to agree.
create or replace function public.license_price_cents(beat public.beats, license text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case license
    when 'mp3' then coalesce(beat.price_cents, 6000)
    when 'wav' then coalesce(beat.price_wav_cents, 12000)
    when 'exclusive' then beat.price_exclusive_cents
    when 'service' then beat.price_cents
  end;
$$;

-- 4. place_order ---------------------------------------------------------

-- The payload carries { beatId, license } pairs now rather than bare ids. The
-- price still never crosses the wire: it is read from the catalogue here.
--
-- The lines are unpacked with jsonb_to_recordset at each use rather than into a
-- temp table: search_path is empty inside this function, so an unqualified temp
-- table would not resolve.
create or replace function public.place_order(payload jsonb, client_ip text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
  new_id bigint;
  item_count int;
  matched int;
  recent int;
  recent_ip int;
  computed_total int;
  buyer_email text;
begin
  select count(*) into item_count
    from (
      select distinct item.beat_id, item.license
        from jsonb_to_recordset(payload -> 'items')
          as item(beat_id bigint, license text)
    ) lines;

  if item_count = 0 or item_count > 20 then
    raise exception 'invalid cart size' using errcode = 'P0001';
  end if;

  -- Every line must resolve to a published row whose kind matches the licence:
  -- a service cannot be bought as a WAV, and a beat cannot be bought as one.
  -- An unknown licence matches nothing, so it fails the same count check.
  select count(*) into matched
    from (
      select distinct item.beat_id, item.license
        from jsonb_to_recordset(payload -> 'items')
          as item(beat_id bigint, license text)
    ) lines
    join public.beats beat on beat.id = lines.beat_id
   where beat.status = 'published'
     and (
       (lines.license = 'service' and beat.kind = 'service')
       or (lines.license in ('mp3', 'wav', 'exclusive') and beat.kind = 'beat')
     );

  if matched <> item_count then
    raise exception 'cart contains unavailable beats' using errcode = 'P0002';
  end if;

  buyer_email := lower(trim(payload ->> 'customerEmail'));

  -- Per-email throttle: one buyer cannot spam the queue.
  select count(*) into recent
    from public.orders
   where customer_email = buyer_email
     and created_at > now() - interval '1 hour';
  if recent >= 5 then
    raise exception 'too many orders' using errcode = 'P0003';
  end if;

  -- Per-network throttle: one IP cannot flood the queue under many emails.
  -- Qualified names keep the parameter apart from the column of the same name.
  if place_order.client_ip is not null then
    select count(*) into recent_ip
      from public.orders
     where public.orders.client_ip = place_order.client_ip
       and created_at > now() - interval '1 hour';
    if recent_ip >= 10 then
      raise exception 'too many orders from this network' using errcode = 'P0004';
    end if;
  end if;

  -- Unpriced exclusive lines are quoted by hand, so they add nothing here.
  select coalesce(sum(coalesce(public.license_price_cents(beat, lines.license), 0)), 0)
    into computed_total
    from (
      select distinct item.beat_id, item.license
        from jsonb_to_recordset(payload -> 'items')
          as item(beat_id bigint, license text)
    ) lines
    join public.beats beat on beat.id = lines.beat_id;

  loop
    new_code := 'SUS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders where code = new_code);
  end loop;

  insert into public.orders (
    code, customer_name, customer_email, artist_name, instagram, note,
    total_cents, client_ip
  ) values (
    new_code,
    trim(payload ->> 'customerName'),
    buyer_email,
    nullif(trim(coalesce(payload ->> 'artistName', '')), ''),
    nullif(trim(coalesce(payload ->> 'instagram', '')), ''),
    nullif(trim(coalesce(payload ->> 'note', '')), ''),
    computed_total,
    place_order.client_ip
  ) returning id into new_id;

  insert into public.order_items (order_id, beat_id, license, title, price_cents)
  select new_id, beat.id, lines.license, beat.title,
         public.license_price_cents(beat, lines.license)
    from (
      select distinct item.beat_id, item.license
        from jsonb_to_recordset(payload -> 'items')
          as item(beat_id bigint, license text)
    ) lines
    join public.beats beat on beat.id = lines.beat_id;

  return new_code;
end;
$$;

revoke execute on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;
