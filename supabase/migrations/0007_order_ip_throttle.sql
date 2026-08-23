-- Defense in depth on the checkout throttle. 0005/0006 capped orders per email
-- (5/hour). That still lets one network flood the queue by cycling through
-- disposable emails. Capping per source IP as well closes that, while the email
-- cap keeps a single buyer from spamming from many networks.
--
-- The IP is passed in by the server action (it is not visible inside Postgres)
-- and stored only for this rate check. It is contact/fraud metadata, not shown
-- anywhere, and reachable only by the admin through the orders RLS policy.

alter table orders add column client_ip text;

-- The signature changes (jsonb -> jsonb, text), so the old overload must go or
-- PostgREST cannot choose between the two.
drop function if exists public.place_order(jsonb);

create or replace function public.place_order(payload jsonb, client_ip text)
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
  recent_ip int;
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

  select sum(price_cents) into computed_total
    from public.beats where id = any(beat_ids);

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

  insert into public.order_items (order_id, beat_id, title, price_cents)
  select new_id, id, title, price_cents
    from public.beats where id = any(beat_ids);

  return new_code;
end;
$$;

revoke execute on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;
