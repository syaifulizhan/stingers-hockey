-- ============================================================================
-- DEWAN LEGASI - rekod kekal pemain yang mewakili di peringkat lebih tinggi
--
-- Dua sifat yang mesti dipegang serentak:
--   1. Admin boleh sunting bebas  -> baris DB, status draft/published
--   2. Rekod kekal 30 tahun       -> RLS awam hanya nampak 'published', dan
--      snapshot yang dibekukan ke dalam repo (src/lib/legasi.ts) menjadi
--      sandaran bila DB senyap. DB ialah permukaan menyunting, bukan
--      satu-satunya sumber kebenaran.
--
-- Draf TIDAK boleh dilihat awam. Itu dikuatkuasakan di sini oleh RLS, bukan
-- oleh UI - kunci client boleh dibaca sesiapa, jadi penapisan di client
-- bukan perlindungan.
-- ============================================================================

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

-- Slug tidak pernah dipadam. Bila slug bertukar, yang lama kekal di sini dan
-- mengalih ke slug baharu selama-lamanya - QR yang sudah dicetak tidak mati.
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

-- Dua penerima pertama. Dimasukkan sebagai DRAF - tiada apa yang tersiar
-- sehingga admin menekan Terbitkan. Fakta di bawah disahkan dari kad fizikal.
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

-- ============================================================================
-- STORAGE - bucket "legasi" untuk potret, gambar album, dan imbasan kad
-- ============================================================================
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

-- PENANDA TAMAT: kalau baris di bawah ini tidak kelihatan dalam SQL Editor,
-- salinan anda terpotong. Salin semula sebelum menekan Run.
select 'DEWAN LEGASI OK' as status, count(*) as draf from public.legacy_records;
