select 'MULA - peringkat legasi' as penanda;

alter table public.legacy_records
  add column if not exists tier text;

alter table public.legacy_records
  drop constraint if exists legacy_records_tier_check;

alter table public.legacy_records
  add constraint legacy_records_tier_check
  check (tier is null or tier in ('daerah', 'negeri', 'kebangsaan', 'negara'));

update public.legacy_records
   set tier = 'kebangsaan'
 where tier is null
   and (event ilike '%MSSM%' or result ilike '%MSSM%');

update public.legacy_records
   set tier = 'negeri'
 where tier is null
   and (event ilike '%MSSS%' or result ilike '%MSSS%');

update public.legacy_records
   set tier = 'daerah'
 where tier is null
   and (event ilike '%MSSD%' or result ilike '%MSSD%');

select 'SEMAK - peringkat setiap rekod' as penanda;

select record_no, cohort, full_name, tier, event
  from public.legacy_records
 order by cohort desc, record_no asc;

select 'SIAP - peringkat legasi' as penanda;
