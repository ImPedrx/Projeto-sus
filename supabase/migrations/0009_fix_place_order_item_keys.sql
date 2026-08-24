-- 0008 unpacked the order lines with
--   jsonb_to_recordset(payload -> 'items') as item(beat_id bigint, license text)
-- but the payload the app sends spells the key "beatId". jsonb_to_recordset
-- matches JSON keys against column names, and an unquoted column name folds to
-- lower case, so "beatId" never matched beat_id: every line arrived with a null
-- id, the join found no beat, and the count check rejected the order as
-- "cart contains unavailable beats". No order could be placed at all.
--
-- Reading the key explicitly with ->> removes the dependency on identifier
-- casing entirely, which is why this does not simply quote the column name.

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
      select distinct
             (item ->> 'beatId')::bigint as beat_id,
             item ->> 'license' as license
        from jsonb_array_elements(payload -> 'items') as item
    ) lines;

  if item_count = 0 or item_count > 20 then
    raise exception 'invalid cart size' using errcode = 'P0001';
  end if;

  -- Every line must resolve to a published row whose kind matches the licence:
  -- a service cannot be bought as a WAV, and a beat cannot be bought as one.
  -- An unknown licence matches nothing, so it fails the same count check.
  select count(*) into matched
    from (
      select distinct
             (item ->> 'beatId')::bigint as beat_id,
             item ->> 'license' as license
        from jsonb_array_elements(payload -> 'items') as item
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
      select distinct
             (item ->> 'beatId')::bigint as beat_id,
             item ->> 'license' as license
        from jsonb_array_elements(payload -> 'items') as item
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
      select distinct
             (item ->> 'beatId')::bigint as beat_id,
             item ->> 'license' as license
        from jsonb_array_elements(payload -> 'items') as item
    ) lines
    join public.beats beat on beat.id = lines.beat_id;

  return new_code;
end;
$$;

revoke execute on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;
