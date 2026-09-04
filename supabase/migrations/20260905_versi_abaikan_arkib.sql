-- ============================================================================
-- Versi rekod: jangan kira penulisan arkib sebagai suntingan
--
-- Menghantar salinan ke Internet Archive menulis balik archived_at dan
-- archive_url ke atas baris itu. Trigger versi menganggap itu suatu suntingan
-- dan mencipta versi baharu - jadi halaman awam melaporkan "dikemas kini 1
-- kali" bagi rekod yang tidak pernah disunting oleh sesiapa.
--
-- Sejarah versi sepatutnya merekod perubahan EDITORIAL sahaja. Penyelenggaraan
-- automatik bukan sebahagian daripada cerita seorang pemain.
-- ============================================================================

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

-- ============================================================================
-- PENANDA TAMAT: kalau baris di bawah ini tidak kelihatan dalam SQL Editor,
-- salinan anda terpotong. Salin semula sebelum menekan Run.
-- ============================================================================
select 'TRIGGER VERSI DIKEMASKINI' as status,
       (select count(*) from public.legacy_versions) as versi_sedia_ada;
