create table if not exists public.legacy_records (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  record_no    text not null unique,
  cohort       integer not null,
  full_name    text not null,
  name_first   text not null default '',
  name_last    text not null default '',
  result       text,
  category     text,
  event        text,
  school       text,
  story        text,
  quote_text   text,
  quote_by     text,
  journey      jsonb not null default '[]'::jsonb,
  photos       jsonb not null default '[]'::jsonb,
  hero_image   text,
  card_front   text,
  card_back    text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists legacy_records_status_idx on public.legacy_records (status, cohort desc);

create table if not exists public.legacy_aliases (
  alias      text primary key,
  slug       text not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_legacy_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_legacy_updated_at on public.legacy_records;
create trigger trg_legacy_updated_at
  before update on public.legacy_records
  for each row execute function public.touch_legacy_updated_at();

alter table public.legacy_records enable row level security;
alter table public.legacy_aliases enable row level security;

drop policy if exists legacy_records_public_read on public.legacy_records;
create policy legacy_records_public_read on public.legacy_records
  for select using (status = 'published');

drop policy if exists legacy_records_coach_all on public.legacy_records;
create policy legacy_records_coach_all on public.legacy_records
  for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists legacy_aliases_public_read on public.legacy_aliases;
create policy legacy_aliases_public_read on public.legacy_aliases
  for select using (true);

drop policy if exists legacy_aliases_coach_all on public.legacy_aliases;
create policy legacy_aliases_coach_all on public.legacy_aliases
  for all using (public.is_coach()) with check (public.is_coach());

insert into public.legacy_records
  (slug, record_no, cohort, full_name, name_first, name_last, result, category, event, school, status)
values
  ('kama-nizar-zahin', 'SH-2026-01', 2026, 'Kama Nizar Zahin bin Kama Rezmai',
   'KAMA NIZAR', 'ZAHIN', 'JOHAN', 'Lelaki 12 Tahun - Selangor',
   'Kejohanan Hoki MSSM 2026', 'SK Taman Desaminium', 'draft'),
  ('adelia-khadeeja', 'SH-2026-02', 2026, 'Adelia Khadeeja',
   'ADELIA', 'KHADEEJA', 'TEMPAT KETIGA', 'Perempuan 12 Tahun - Selangor',
   'Kejohanan Hoki MSSM 2026', 'SK Taman Desaminium', 'draft')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('legasi', 'legasi', true)
on conflict (id) do nothing;

drop policy if exists "coach upload legasi" on storage.objects;
create policy "coach upload legasi" on storage.objects for insert to authenticated
  with check (bucket_id = 'legasi' and public.is_coach());

drop policy if exists "coach delete legasi" on storage.objects;
create policy "coach delete legasi" on storage.objects for delete to authenticated
  using (bucket_id = 'legasi' and public.is_coach());

drop policy if exists "public read legasi" on storage.objects;
create policy "public read legasi" on storage.objects for select
  using (bucket_id = 'legasi');

create table if not exists public.legacy_versions (
  id           uuid primary key default gen_random_uuid(),
  record_id    uuid not null references public.legacy_records(id) on delete cascade,
  slug         text not null,
  version_no   integer not null,
  snapshot     jsonb not null,
  captured_at  timestamptz not null default now(),
  unique (record_id, version_no)
);

create index if not exists legacy_versions_record_idx
  on public.legacy_versions (record_id, version_no desc);

create or replace function public.capture_legacy_version()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  next_no integer;
begin
  if new.status is distinct from 'published' then
    return new;
  end if;

  -- Baris yang sudah tersiar dan tiada apa yang bermakna berubah: langkau,
  -- supaya menekan Simpan tanpa suntingan tidak mencipta versi kosong.
  if tg_op = 'UPDATE' and old.status = 'published' and
     to_jsonb(new) - 'updated_at' = to_jsonb(old) - 'updated_at' then
    return new;
  end if;

  select coalesce(max(version_no), 0) + 1 into next_no
    from public.legacy_versions where record_id = new.id;

  insert into public.legacy_versions (record_id, slug, version_no, snapshot)
  values (new.id, new.slug, next_no, to_jsonb(new));

  return new;
end;
$$;

drop trigger if exists trg_capture_legacy_version on public.legacy_records;
create trigger trg_capture_legacy_version
  after insert or update on public.legacy_records
  for each row execute function public.capture_legacy_version();

alter table public.legacy_versions enable row level security;

drop policy if exists legacy_versions_public_read on public.legacy_versions;
create policy legacy_versions_public_read on public.legacy_versions
  for select using (
    exists (
      select 1 from public.legacy_records r
      where r.id = legacy_versions.record_id and r.status = 'published'
    )
  );

alter table public.legacy_records
  add column if not exists archived_at timestamptz;

alter table public.legacy_records
  add column if not exists archive_url text;

select 'SIAP - HALL OF HONOUR' as status,
       (select count(*) from public.legacy_records) as rekod,
       (select count(*) from public.legacy_versions) as versi;
