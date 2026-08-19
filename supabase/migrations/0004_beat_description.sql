-- Optional sales copy for a beat, written in the admin panel and shown in the
-- expanded card on the storefront.
alter table beats add column description text;

alter table beats
  add constraint beats_description_length
  check (description is null or length(description) <= 600);
