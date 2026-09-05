select 'MULA - bahagian sekolah' as penanda;

alter table public.legacy_records
  add column if not exists stage text;

alter table public.legacy_records
  drop constraint if exists legacy_records_stage_check;

alter table public.legacy_records
  add constraint legacy_records_stage_check
  check (stage is null or stage in ('rendah', 'menengah', 'pasca'));

alter table public.legacy_records
  disable trigger trg_capture_legacy_version;

update public.legacy_records
   set stage = 'rendah'
 where stage is null;

alter table public.legacy_records
  enable trigger trg_capture_legacy_version;

select 'SEMAK - bahagian setiap rekod' as penanda;

select record_no, cohort, full_name, tier, stage, event
  from public.legacy_records
 order by cohort desc, record_no asc;

select 'SIAP - bahagian sekolah' as penanda;
