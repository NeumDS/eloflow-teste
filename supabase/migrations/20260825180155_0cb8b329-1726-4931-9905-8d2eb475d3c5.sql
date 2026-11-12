
create policy "curriculos_read" on storage.objects for select to authenticated using (bucket_id = 'curriculos');
create policy "curriculos_insert" on storage.objects for insert to authenticated with check (bucket_id = 'curriculos');
create policy "curriculos_update" on storage.objects for update to authenticated using (bucket_id = 'curriculos');
create policy "curriculos_delete" on storage.objects for delete to authenticated using (bucket_id = 'curriculos');
