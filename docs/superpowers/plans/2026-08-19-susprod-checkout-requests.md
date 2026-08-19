# SusProd Checkout & Order Requests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the inert cart into a request that reaches the producer. A visitor fills a short form, the order is recorded, the producer sees a ticket in the admin panel, approves or cancels it, and hands over the master through a signed link — all without a payment gateway.

**Why no gateway:** SusProd cannot reliably settle through a Brazilian gateway and prefers PayPal, negotiated directly with the buyer. Payment therefore happens off-platform, in a conversation. The site's job is to capture the intent, price it, and give the producer a queue to work from.

**Spec:** `docs/superpowers/specs/2026-08-17-susprod-beat-store-design.md` (the checkout section is superseded by this plan: no Stripe, no Mercado Pago).

## Plan set

This replaces plan 3 as originally scoped.

1. **Foundation & admin** — done, verified 2026-08-19.
2. **Public storefront** — done, delivered alongside plan 1.
3. **Checkout & order requests** (this plan).

## Decisions taken

| Question | Decision |
|---|---|
| How the producer is notified | Email on every order, plus a ticket in the admin panel |
| How the buyer gets the files | Signed link generated from the panel after approval |
| Checkout fields | Email, name, artist name, Instagram |
| Where PayPal appears | Nowhere on the site — only in the conversation that follows |

## Global Constraints

- Carries over every constraint from plan 1: prices as integer cents, RLS enabled and forced on every table, `auth.uid()` wrapped in a subselect, lowercase identifiers, UI copy in Brazilian Portuguese, code and comments in English.
- **The client never sets a price.** The cart lives in `localStorage`, which anyone can edit. Checkout sends beat ids only; the server reads the current prices from `beats` and computes the total.
- **Customers never authenticate.** No account, no login, no session — an order is identified by its code.
- **An order is never deleted.** Cancelling sets a status. Money moves outside the platform, so the record of what was agreed is the only trail that exists.
- Masters stay private. Approval hands out a time-limited signed URL; the bucket never becomes public.
- Prices and titles are frozen into `order_items` at the moment of the order, so later edits to a beat cannot rewrite history.

---

## File Structure

```
supabase/migrations/0005_orders.sql          orders, order_items, RLS, place_order()
src/lib/orders/schema.ts                     Zod schema for the checkout form
src/lib/orders/code.ts                       order code generation and validation
src/lib/orders/queries.ts                    typed reads for the admin queue
src/lib/orders/message.ts                    the notification body, as plain text
src/app/(site)/checkout/page.tsx             checkout form (pt)
src/app/(site)/checkout/checkout-form.tsx    client form, reads the cart
src/app/(site)/checkout/actions.ts           placeOrder server action
src/app/(site)/checkout/[code]/page.tsx      confirmation screen
src/app/en/checkout/…                        English mirror of the three above
src/app/admin/pedidos/page.tsx               order queue, grouped by status
src/app/admin/pedidos/[id]/page.tsx          one order: items, contact, actions
src/app/admin/pedidos/actions.ts             approve, cancel, sign delivery links
src/lib/email/send.ts                        notification transport (see Task 6)
tests/lib/orders/*.test.ts                   Vitest specs for the pure helpers
```

---

### Task 1: Order tables and a server-side order placer

**Files:**
- Create: `supabase/migrations/0005_orders.sql`
- Test: verified by hand against the live project (steps 5–7)

**Interfaces:**
- Produces: tables `orders` and `order_items`; function `public.place_order(payload jsonb) returns text` returning the order code.
- Consumes: `beats`, `private.is_admin()` from `0001_initial_schema.sql`.

- [ ] **Step 1: Write the tables**

```sql
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
  -- was agreed.
  title text not null,
  price_cents int not null,
  primary key (order_id, beat_id)
);

create index order_items_beat_id_idx on order_items (beat_id);
create index orders_status_created_at_idx on orders (status, created_at desc);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();
```

`on delete restrict` on `beat_id` is deliberate: a beat that has been ordered cannot be deleted out from under the record.

- [ ] **Step 2: Lock the tables down**

```sql
alter table orders enable row level security;
alter table orders force row level security;
alter table order_items enable row level security;
alter table order_items force row level security;

-- No anon policy at all. Orders are written by place_order() below, which is
-- SECURITY DEFINER, and read only by the admin.
create policy orders_admin_all on orders
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy order_items_admin_all on order_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
```

This is the opposite shape from the rest of the schema: `anon` can neither read nor write these tables directly.

- [ ] **Step 3: Write `place_order`**

A `SECURITY DEFINER` function is what lets an anonymous visitor create an order without any table grant, and it is also where the price is decided — the payload carries ids, never amounts.

```sql
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
begin
  select array_agg((value #>> '{}')::bigint)
    into beat_ids
    from jsonb_array_elements(payload -> 'beatIds');

  item_count := coalesce(array_length(beat_ids, 1), 0);
  if item_count = 0 or item_count > 20 then
    raise exception 'invalid cart size';
  end if;

  -- A published beat is the only thing that can be ordered, and every id must
  -- resolve or the whole order is refused rather than silently shortened.
  if (select count(*) from public.beats
      where id = any(beat_ids) and status = 'published') <> item_count then
    raise exception 'cart contains unavailable beats';
  end if;

  -- Cheap throttle: the same address cannot open more than five orders an hour.
  select count(*) into recent
    from public.orders
   where customer_email = lower(payload ->> 'customerEmail')
     and created_at > now() - interval '1 hour';
  if recent >= 5 then
    raise exception 'too many orders';
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
    payload ->> 'customerName',
    lower(payload ->> 'customerEmail'),
    nullif(payload ->> 'artistName', ''),
    nullif(payload ->> 'instagram', ''),
    nullif(payload ->> 'note', ''),
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
```

- [ ] **Step 4: Apply the migration**

```bash
npx supabase db push          # or paste into the SQL editor, in order
```

- [ ] **Step 5: Verify an anonymous order can be placed**

With the publishable key only, call `place_order` with two real published beat ids and confirm it returns a code.

- [ ] **Step 6: Verify the tables stay unreadable**

With the publishable key, `select * from orders` must return an empty result, not rows — same shape as the `admin_users` check in plan 1.

- [ ] **Step 7: Verify the price cannot be forced**

Call `place_order` with a payload that also carries `totalCents: 1`. The stored `total_cents` must equal the sum of the beats' real prices.

---

### Task 2: Checkout form and the order action

**Files:**
- Create: `src/lib/orders/schema.ts`, `src/lib/orders/code.ts`
- Create: `src/app/(site)/checkout/page.tsx`, `checkout-form.tsx`, `actions.ts`
- Test: `tests/lib/orders/schema.test.ts`, `tests/lib/orders/code.test.ts`

**Interfaces:**
- Produces: `placeOrder(input)` server action returning `{ code }` or `{ error }`; `isOrderCode(value): boolean`.
- Consumes: `useCart()` from `src/components/cart/cart-provider.tsx`.

- [ ] **Step 1: Zod schema**

Required: `customerName` (2–80 chars), `customerEmail` (email). Optional: `artistName` (≤80), `instagram` (≤40, `@` stripped), `note` (≤1000). `beatIds`: 1–20 positive integers.

Only email and name are required — artist and Instagram are context the producer likes to have, not a barrier to ordering.

- [ ] **Step 2: The form**

A client component that reads the cart, lists what is being requested with the total, and posts the ids plus the contact fields. Copy must say plainly that this is a request: the producer replies by email to arrange payment. No prices are editable and no payment method is named.

- [ ] **Step 3: The action**

Validate with Zod, call `place_order` through the request-scoped Supabase client, and on success clear the cart and redirect to `/checkout/<code>`. Map the function's exceptions to readable Portuguese messages (`cart contains unavailable beats` → a beat left the catalog; `too many orders` → wait a bit).

- [ ] **Step 4: Confirmation screen**

`/checkout/[code]` shows the code and explains what happens next. It does **not** read the order back — the tables are unreadable to `anon` by design, and the code alone is what the buyer quotes in the conversation.

- [ ] **Step 5: Wire the drawer**

Replace the disabled button in `src/components/cart/cart-drawer.tsx` with a link to the checkout, and drop the "em breve" note.

- [ ] **Step 6: English mirror**

Mirror all three routes under `/en`, adding the strings to `src/lib/i18n.ts`.

---

### Task 3: The admin order queue

**Files:**
- Create: `src/lib/orders/queries.ts`, `src/app/admin/pedidos/page.tsx`, `src/app/admin/pedidos/[id]/page.tsx`, `src/app/admin/pedidos/actions.ts`
- Test: `tests/lib/orders/queries.test.ts`

**Interfaces:**
- Produces: `listOrders(supabase, status?)`, `getOrder(supabase, id)`, and the `approveOrder` / `cancelOrder` actions.

- [ ] **Step 1: Queue screen**

Newest first, filtered by status, showing code, buyer, item count, total and age. Pending orders lead.

- [ ] **Step 2: Detail screen**

Contact block (email, artist, Instagram, note), the frozen item list, the total, and the status history.

- [ ] **Step 3: Approve and cancel**

Both are server actions that update `status` and return a result the client renders — the same shape `BeatRowActions` uses, since a form action that returns a value swallows the message (recorded in plan 1's deviations).

Legal transitions: `pending → approved | cancelled`, `approved → paid | cancelled`. Anything else is refused.

- [ ] **Step 4: Add the panel link**

`/admin` gains a "Pedidos" entry with the pending count.

---

### Task 4: Delivery by signed link

**Files:**
- Modify: `src/app/admin/pedidos/actions.ts`, `src/app/admin/pedidos/[id]/page.tsx`

**Interfaces:**
- Produces: `signDelivery(orderId)` returning one signed URL per item.

- [ ] **Step 1: The action**

For an approved or paid order, call `createSignedUrl(master_mp3_path, 7 * 24 * 3600)` for each item, and the WAV too when one exists. Refuse for `pending` and `cancelled` — a link must never exist before the producer has agreed to the sale.

- [ ] **Step 2: The UI**

A button that reveals the links with a copy control and states the expiry date, so the producer knows what he is sending.

- [ ] **Step 3: Verify the boundary**

Confirm a signed URL works while fresh, and that the same path without the signature is refused. Confirm the action refuses a pending order.

---

### Task 5: Abuse resistance

**Files:**
- Modify: `src/app/(site)/checkout/actions.ts`

- [ ] **Step 1: Honeypot**

A hidden field no human fills. Filled means bot: return the confirmation screen without writing anything.

- [ ] **Step 2: Confirm the throttle**

Six orders in a row from one address must be refused on the sixth, from the function, not the UI.

- [ ] **Step 3: Decide on BotID**

If real spam shows up, Vercel BotID sits in front of the action. Do not add it pre-emptively.

---

### Task 6: Producer notification — BLOCKED ON A DECISION

**Status:** the transport is undecided. Resend through the Vercel Marketplace requires a domain SusProd does not own and starts at **US$ 20/month**; the free tier exists only on a Resend account created directly. Everything else in this plan works without it.

**Files:**
- Create: `src/lib/orders/message.ts`, `src/lib/email/send.ts`
- Modify: `src/app/(site)/checkout/actions.ts`
- Test: `tests/lib/orders/message.test.ts`

- [ ] **Step 1: Build the message as data, not markup**

`buildOrderMessage(order)` returns plain text: code, buyer contact, one line per item with its frozen price, the total, and a link to the ticket. Pure function, easy to test, reusable by any transport.

- [ ] **Step 2: Pick the transport**

Either a Resend API key from a directly-created account (`RESEND_API_KEY`, free tier, still needs a verified sending domain), or the Marketplace install once a domain exists:

```bash
vercel integration add resend/resend-email --no-claim -m domain=<domain> -m region=sa-east-1
```

- [ ] **Step 3: Send after the order is committed**

Never before: a failed send must not lose an order. Wrap the call so a transport error is logged and swallowed — the ticket already exists in the panel, which is the source of truth.

- [ ] **Step 4: Verify**

Place a real order and confirm the email arrives with the right total, and that an order still succeeds when the transport is deliberately broken.

---

## Verification

- [ ] `npm run build` and `npm test` pass.
- [ ] An anonymous visitor can place an order; the tables stay unreadable to `anon`.
- [ ] A forged total in the payload is ignored; the stored total matches the catalog.
- [ ] An order for an unpublished beat is refused.
- [ ] The queue shows the order; approve and cancel move the status and nothing deletes a row.
- [ ] A signed delivery link works, expires, and cannot be obtained for a pending order.
- [ ] The producer is notified (or, if Task 6 is deferred, the ticket is visibly the only channel and the panel is checked deliberately).
