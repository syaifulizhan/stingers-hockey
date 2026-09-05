select 'MULA - terjemahan' as penanda;

alter table public.news
  add column if not exists translations jsonb;

alter table public.legacy_records
  add column if not exists translations jsonb;

create or replace function public.capture_legacy_version()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  next_no integer;
  abai text[] := array['updated_at', 'archived_at', 'archive_url', 'translations'];
begin
  if new.status is distinct from 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' and
     (to_jsonb(new) - abai) = (to_jsonb(old) - abai) then
    return new;
  end if;

  select coalesce(max(version_no), 0) + 1 into next_no
    from public.legacy_versions where record_id = new.id;

  insert into public.legacy_versions (record_id, slug, version_no, snapshot)
  values (new.id, new.slug, next_no, to_jsonb(new));

  return new;
end;
$$;

select 'SEMAK - lajur wujud' as penanda;

select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and column_name = 'translations'
 order by table_name;

select 'SEMAK - kiraan versi (tidak patut berubah selepas ini)' as penanda;

select slug, count(*) as versi
  from public.legacy_versions
 group by slug
 order by slug;

select 'SIAP - terjemahan' as penanda;
