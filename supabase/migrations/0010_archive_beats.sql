-- A beat that has been ordered cannot be deleted: order_items.beat_id is
-- ON DELETE RESTRICT so the record of what was sold keeps pointing at a real
-- row. That rule stays -- but until now it left the producer with no way to
-- take such a beat off the shelf, only a delete that failed.
--
-- Archiving is that way out: the row survives for the order history, and the
-- beat leaves the store. Nothing else has to change to hide it, because every
-- public read already asks for status = 'published' -- the RLS policy on beats,
-- the catalogue queries, and place_order's check that a cart line is still for
-- sale.
alter table beats drop constraint beats_status_valid;

alter table beats add constraint beats_status_valid
  check (status in ('draft', 'published', 'sold', 'archived'));
