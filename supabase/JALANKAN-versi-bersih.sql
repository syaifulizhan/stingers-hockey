create or replace function public.capture_legacy_version()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  next_no integer;
  abai text[] := array['updated_at', 'archived_at', 'archive_url'];
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

with berturut as (
  select id,
         record_id,
         version_no,
         snapshot,
         lag(snapshot) over (partition by record_id order by version_no) as sebelum
    from public.legacy_versions
),
palsu as (
  select id
    from berturut
   where sebelum is not null
     and (snapshot - array['updated_at', 'archived_at', 'archive_url'])
       = (sebelum  - array['updated_at', 'archived_at', 'archive_url'])
)
delete from public.legacy_versions
 where id in (select id from palsu);

update public.legacy_versions
   set version_no = version_no + 100000;

with semula as (
  select id,
         row_number() over (partition by record_id order by captured_at, version_no) as baru
    from public.legacy_versions
)
update public.legacy_versions v
   set version_no = s.baru
  from semula s
 where v.id = s.id;

select 'VERSI DIBERSIHKAN' as status,
       (select count(*) from public.legacy_versions) as versi_tinggal;
