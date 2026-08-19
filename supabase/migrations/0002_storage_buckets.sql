-- Cover art and tagged previews are world-readable.
insert into storage.buckets (id, name, public)
values ('beat-public', 'beat-public', true)
on conflict (id) do nothing;

-- Untagged masters. Never public; served only as signed URLs after purchase.
insert into storage.buckets (id, name, public)
values ('beat-private', 'beat-private', false)
on conflict (id) do nothing;

create policy beat_public_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'beat-public' and (select private.is_admin()))
  with check (bucket_id = 'beat-public' and (select private.is_admin()));

create policy beat_private_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'beat-private' and (select private.is_admin()))
  with check (bucket_id = 'beat-private' and (select private.is_admin()));
