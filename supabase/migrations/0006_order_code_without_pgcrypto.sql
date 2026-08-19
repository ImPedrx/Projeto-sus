-- 0005 generated the order code with gen_random_bytes(), which belongs to
-- pgcrypto and lives in the extensions schema on Supabase. The function pins
-- search_path to '' — right for a SECURITY DEFINER function — so the call could
-- not resolve and every order failed with 42883.
--
-- gen_random_uuid() is core Postgres and lives in pg_catalog, which stays
-- visible whatever search_path says. Same six hex characters, no extension.

create or replace function public.place_order(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
  new_id bigint;
  beat_ids bigint[];
  item_count int;
  recent int;
  computed_total int;
  buyer_email text;
begin
  select array_agg(distinct (value #>> '{}')::bigint)
    into beat_ids
    from jsonb_array_elements(payload -> 'beatIds');

  item_count := coalesce(array_length(beat_ids, 1), 0);
  if item_count = 0 or item_count > 20 then
    raise exception 'invalid cart size' using errcode = 'P0001';
  end if;

  if (select count(*) from public.beats
      where id = any(beat_ids) and status = 'published') <> item_count then
    raise exception 'cart contains unavailable beats' using errcode = 'P0002';
  end if;

  buyer_email := lower(trim(payload ->> 'customerEmail'));

  select count(*) into recent
    from public.orders
   where customer_email = buyer_email
     and created_at > now() - interval '1 hour';
  if recent >= 5 then
    raise exception 'too many orders' using errcode = 'P0003';
  end if;

  select sum(price_cents) into computed_total
    from public.beats where id = any(beat_ids);

  loop
    new_code := 'SUS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders where code = new_code);
  end loop;

  insert into public.orders (
    code, customer_name, customer_email, artist_name, instagram, note, total_cents
  ) values (
    new_code,
    trim(payload ->> 'customerName'),
    buyer_email,
    nullif(trim(coalesce(payload ->> 'artistName', '')), ''),
    nullif(trim(coalesce(payload ->> 'instagram', '')), ''),
    nullif(trim(coalesce(payload ->> 'note', '')), ''),
    computed_total
  ) returning id into new_id;

  insert into public.order_items (order_id, beat_id, title, price_cents)
  select new_id, id, title, price_cents
    from public.beats where id = any(beat_ids);

  return new_code;
end;
$$;

revoke execute on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
