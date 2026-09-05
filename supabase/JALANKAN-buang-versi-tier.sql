select 'MULA - buang versi tier' as penanda;

select 'SEBELUM' as fasa, slug, version_no, captured_at
  from public.legacy_versions
 order by slug, version_no;

with serentak as (
  select captured_at
    from public.legacy_versions
   group by captured_at
  having count(distinct record_id) > 1
),
berturut as (
  select id,
         record_id,
         version_no,
         captured_at,
         snapshot,
         lag(snapshot) over (partition by record_id order by version_no) as sebelum
    from public.legacy_versions
),
palsu as (
  select id
    from berturut
   where sebelum is not null
     and captured_at in (select captured_at from serentak)
     and (snapshot - array['updated_at', 'archived_at', 'archive_url', 'tier'])
       = (sebelum  - array['updated_at', 'archived_at', 'archive_url', 'tier'])
     and (sebelum  ->> 'tier') is null
     and (snapshot ->> 'tier') is not null
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

select 'SELEPAS' as fasa, slug, version_no, captured_at
  from public.legacy_versions
 order by slug, version_no;

select 'SIAP - buang versi tier' as penanda;
