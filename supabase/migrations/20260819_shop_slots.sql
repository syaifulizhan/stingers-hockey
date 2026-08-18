-- ============================================================================
-- SLOT TEMPAHAN (batch) + PEMBERSIHAN SELAMAT — 2026-08-19
--
-- Masalah: `shop_orders` tiada penanda slot. Bila slot tempahan baharu dibuka,
-- tempahan lama & baharu bercampur dalam senarai coach DAN dalam Pivot supplier
-- (Pivot mengambil semua tempahan "disahkan", bukan ikut tarikh). Satu-satunya
-- jalan "membersih" sebelum ini ialah memadam — dan pg_cron membuang kekal
-- selepas 3 hari, jadi rekod pelanggan (saiz, harga, sejarah) hilang terus.
--
-- Penyelesaian: setiap tempahan dicop dengan slot. Buka slot baharu = tukar
-- penanda, BUKAN padam. Panel coach tunjuk slot semasa; slot lama masuk arkib.
--
-- Migrasi ini TAMBAH sahaja — tiada baris dipadam, tiada tingkah laku berubah
-- sehingga admin menekan "Buka Slot Baharu". Selamat dijalankan berulang.
--
-- URUTAN: jalankan SQL ini DAHULU, kemudian baru deploy kod.
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SEMAKAN PRA-TERBANG — hanya MEMBACA, tidak mengubah apa-apa.
-- Sahkan berapa tempahan sedia ada yang akan dicop sebagai 'slot-1':
--
--   select status, count(*), min(created_at), max(created_at)
--   from public.shop_orders where deleted_at is null group by status;
--
-- Ambil backup dahulu (butang "Backup JSON" di panel Tempahan) sebelum teruskan.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. Jadual slot ──────────────────────────────────────────────────────────
create table if not exists public.shop_batches (
  id         text primary key,                        -- slug: 'slot-2'
  label      text not null,                           -- 'Slot 2 · Jersi 2026/27'
  opened_at  timestamptz not null default now(),
  closed_at  timestamptz                              -- null = slot masih dibuka
);

alter table public.shop_batches enable row level security;

drop policy if exists shop_batches_select on public.shop_batches;
create policy shop_batches_select on public.shop_batches for select to authenticated
  using (public.is_admin());

drop policy if exists shop_batches_write on public.shop_batches;
create policy shop_batches_write on public.shop_batches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.shop_batches to authenticated;

-- ── 2. Penanda slot pada tempahan + slot semasa dalam tetapan ───────────────
alter table public.shop_orders   add column if not exists batch text;
alter table public.shop_settings add column if not exists current_batch text;
create index if not exists shop_orders_batch_idx on public.shop_orders (batch);

-- ── 3. Cop slot secara AUTOMATIK dalam DB ───────────────────────────────────
-- Dalam DB, bukan dalam kod app: mana-mana laluan insert (borang awam, SQL
-- Editor, skrip masa depan) dapat cop yang betul tanpa perlu ingat.
create or replace function public.stamp_order_batch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Bukan admin (termasuk borang awam yang guna anon key) TIDAK boleh memilih
  -- slotnya sendiri — kalau tidak, sesiapa yang bercakap terus dengan Supabase
  -- boleh menyuntik tempahan ke dalam arkib slot lama.
  if new.batch is null or btrim(new.batch) = '' or not public.is_admin() then
    select current_batch into new.batch from public.shop_settings where id = 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_order_batch on public.shop_orders;
create trigger trg_stamp_order_batch
  before insert on public.shop_orders
  for each row execute function public.stamp_order_batch();

-- ── 4. Backfill: tempahan sedia ada = 'slot-1' ──────────────────────────────
-- Hanya berjalan SEKALI (bila current_batch masih null). Selepas slot-2 dibuka,
-- blok ini tidak akan menyentuh apa-apa lagi.
do $$
declare v_cur text;
begin
  select current_batch into v_cur from public.shop_settings where id = 1;
  if v_cur is null then
    insert into public.shop_batches (id, label, opened_at)
    values (
      'slot-1',
      'Slot 1 · tempahan terdahulu',
      coalesce((select min(created_at) from public.shop_orders), now())
    )
    on conflict (id) do nothing;

    update public.shop_orders set batch = 'slot-1' where batch is null;
    update public.shop_settings set current_batch = 'slot-1' where id = 1;
  end if;
end $$;

-- ── 5. Buka slot baharu — satu transaksi, atomik ────────────────────────────
-- Tutup slot semasa + cipta slot baharu + tukar penanda. Kalau mana-mana
-- langkah gagal, semuanya berundur — tiada keadaan separuh siap.
create or replace function public.open_shop_slot(p_id text, p_label text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id    text := btrim(coalesce(p_id, ''));
  v_label text := btrim(coalesce(p_label, ''));
begin
  if not public.is_admin() then
    raise exception 'Hanya admin boleh buka slot tempahan.';
  end if;
  if v_id = '' then
    raise exception 'ID slot tidak boleh kosong.';
  end if;
  if v_id !~ '^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$' then
    raise exception 'ID slot mesti huruf kecil, nombor & sengkang sahaja.';
  end if;

  update public.shop_batches set closed_at = now()
   where id = (select current_batch from public.shop_settings where id = 1)
     and closed_at is null;

  insert into public.shop_batches (id, label)
  values (v_id, coalesce(nullif(v_label, ''), v_id))
  on conflict (id) do update set label = excluded.label, closed_at = null;

  update public.shop_settings set current_batch = v_id where id = 1;
end;
$$;

grant execute on function public.open_shop_slot(text, text) to authenticated;

-- ── 6. Notifikasi yatim ─────────────────────────────────────────────────────
-- `notifications.ref_id` tiada foreign key, jadi bila pg_cron membuang tempahan
-- kekal, notifikasi "Tempahan baharu: …" tertinggal dan menuding ke rekod yang
-- sudah tiada. Trigger ini menutup lubang itu untuk SEMUA laluan padam (cron,
-- panel coach, SQL manual) — satu tempat, bukan diingat di setiap pemanggil.
create or replace function public.cleanup_order_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications
   where ref_type = 'order' and ref_id = old.id::text;
  return old;
end;
$$;

drop trigger if exists trg_cleanup_order_notifications on public.shop_orders;
create trigger trg_cleanup_order_notifications
  after delete on public.shop_orders
  for each row execute function public.cleanup_order_notifications();

-- Bersihkan yang sudah yatim sebelum trigger ini wujud.
delete from public.notifications n
 where n.ref_type = 'order'
   and not exists (select 1 from public.shop_orders o where o.id::text = n.ref_id);

-- ── 7. Semakan selepas migrasi (jalankan & baca hasilnya) ───────────────────
--   select batch, count(*) from public.shop_orders group by batch;
--   select * from public.shop_batches;
--   select current_batch from public.shop_settings where id = 1;
-- Jangkaan: semua tempahan = 'slot-1', satu baris slot, current_batch='slot-1'.
