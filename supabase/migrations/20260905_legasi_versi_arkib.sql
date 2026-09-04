-- ============================================================================
-- HALL OF HONOUR - sejarah versi kekal + jejak arkib
--
-- Rekod tersiar BOLEH disunting - seorang pemain naik ke peringkat lebih
-- tinggi, cerita diperbaiki, gambar ditambah. Tetapi setiap versi yang pernah
-- tersiar mesti kekal selamanya.
--
-- Sebab itu penting: kad fizikal membawa QR ke alamat yang sama selama-lamanya.
-- Bila Zahin naik ke peringkat lebih tinggi pada 2028, QR yang sama patut
-- menunjukkan cerita yang lebih besar - dan cerita lama tidak hilang, ia
-- menjadi lapisan dalam rekod itu.
--
-- Penguatkuasaan di sini adalah struktur, bukan disiplin: versi ditulis oleh
-- trigger (tiada laluan kod boleh melangkaunya), dan TIADA polisi update atau
-- delete pada jadual versi - jadi ia tidak boleh diubah walaupun oleh admin.
-- ============================================================================

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

-- Tangkap versi setiap kali baris TERSIAR berubah, dan pada saat ia mula
-- tersiar. Suntingan kepada draf tidak ditangkap - draf belum jadi sejarah.
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

-- Sejarah sesuatu rekod tersiar adalah sebahagian daripada rekod itu, jadi ia
-- boleh dibaca awam. Tiada polisi insert/update/delete: hanya trigger
-- (security definer) boleh menulis, dan tiada sesiapa boleh memadam.
drop policy if exists legacy_versions_public_read on public.legacy_versions;
create policy legacy_versions_public_read on public.legacy_versions
  for select using (
    exists (
      select 1 from public.legacy_records r
      where r.id = legacy_versions.record_id and r.status = 'published'
    )
  );

-- ============================================================================
-- Jejak arkib - bila setiap alamat terakhir dihantar ke Internet Archive.
-- Ini jaring terakhir: jika hoki.my hilang suatu hari, URL bercetak pada kad
-- masih boleh ditampal ke Wayback Machine.
-- ============================================================================
alter table public.legacy_records
  add column if not exists archived_at timestamptz;

alter table public.legacy_records
  add column if not exists archive_url text;

-- ============================================================================
-- PENANDA TAMAT: kalau baris di bawah ini tidak kelihatan dalam SQL Editor,
-- salinan anda terpotong. Salin semula sebelum menekan Run.
-- ============================================================================
select 'VERSI DAN ARKIB OK' as status,
       (select count(*) from public.legacy_records) as rekod,
       (select count(*) from public.legacy_versions) as versi;
