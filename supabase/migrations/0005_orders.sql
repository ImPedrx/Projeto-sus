-- Orders placed from the storefront. Payment happens off-platform, so an order
-- is a request the producer works through by hand rather than a completed sale.

create table orders (
  id bigint generated always as identity primary key,
  code text not null unique,
  customer_name text not null,
  customer_email text not null,
  artist_name text,
  instagram text,
  note text,
  total_cents int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_valid check (status in ('pending', 'approved', 'paid', 'cancelled')),
  constraint orders_total_positive check (total_cents > 0),
  constraint orders_email_shape check (customer_email like '%_@_%.__%'),
  constraint orders_name_not_blank check (length(trim(customer_name)) > 0),
  constraint orders_note_length check (note is null or length(note) <= 1000)
);

create table order_items (
  order_id bigint not null references orders (id) on delete cascade,
  beat_id bigint not null references beats (id) on delete restrict,
  -- Frozen at order time: a later price change or rename must not rewrite what
  -- was agreed. ON DELETE RESTRICT keeps an ordered beat from being deleted out
  -- from under the record.
  title text not null,
  price_cents int not null,
  primary key (order_id, beat_id)
);

create index order_items_beat_id_idx on order_items (beat_id);
create index orders_status_created_at_idx on orders (status, created_at desc);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;
alter table orders force row level security;
alter table order_items enable row level security;
alter table order_items force row level security;

-- No anon policy at all, which is the opposite shape from the rest of the
-- schema: orders are written by place_order() below, a SECURITY DEFINER
-- function, and read only by the admin. A visitor can create an order without
-- ever being able to read one.
create policy orders_admin_all on orders
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy order_items_admin_all on order_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- The payload carries beat ids and contact details, never a price: the total is
-- computed here from the catalog, so a tampered cart in localStorage cannot
-- decide what a beat costs.
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

  -- Every id must resolve to a published beat, or the order is refused outright
  -- rather than quietly shortened to whatever still exists.
  if (select count(*) from public.beats
      where id = any(beat_ids) and status = 'published') <> item_count then
    raise exception 'cart contains unavailable beats' using errcode = 'P0002';
  end if;

  buyer_email := lower(trim(payload ->> 'customerEmail'));

  -- Cheap throttle so a public form cannot be used to flood the queue.
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
    new_code := 'SUS-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
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
