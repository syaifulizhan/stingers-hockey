-- ============================================================================
-- KEDAI (Fasa 1) — produk tempahan boleh edit oleh admin (bukan hardcoded).
-- Selamat dijalankan berulang (idempotent). Run sekali di Supabase SQL Editor.
--   • Kategori tetap: 'jersi', 'hustle_gear' (admin edit tetapan + variasi)
--   • jersey_editions: jersi lama / legasi (dikongsi galeri & tab Jersi Lama)
--   • Enjin harga: seunit = harga asas + caj saiz + (cetak nama? +caj)
-- ============================================================================

-- Produk utama — kategori tetap; admin edit tetapan harga & gambar.
create table if not exists public.shop_products (
  id                  text primary key,             -- 'jersi' | 'hustle_gear'
  name                text not null,
  description         text,
  image_url           text,
  base_price          numeric(8,2) not null default 0,   -- untuk hustle_gear
  big_size_surcharge  numeric(8,2) not null default 0,   -- caj saiz besar
  kid_discount        numeric(8,2) not null default 0,   -- potongan saiz kanak
  name_print_enabled  boolean not null default false,
  name_print_fee      numeric(8,2) not null default 0,
  active              boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- Variasi jersi (berstruktur: Reka Bentuk · Lengan · Material) — untuk pivot
-- supplier yang kemas. label = paparan auto.
create table if not exists public.shop_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.shop_products(id) on delete cascade,
  label       text not null,
  reka_bentuk text,
  lengan      text,
  material    text,
  price       numeric(8,2) not null default 0,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.shop_variants add column if not exists reka_bentuk text;
alter table public.shop_variants add column if not exists lengan text;
alter table public.shop_variants add column if not exists material text;
alter table public.shop_variants add column if not exists penutup text;   -- Butang / Zip
alter table public.shop_variants add column if not exists lycra_available boolean not null default false; -- variasi ini tawar Lycra?

-- Edisi jersi (legasi + jualan jersi lama). Dikongsi galeri & tab Jersi Lama.
create table if not exists public.jersey_editions (
  id          text primary key,
  name        text not null,
  year        text,
  tournament  text,
  region      text,
  venue       text,
  note        text,
  image_url   text,
  price       numeric(8,2) not null default 0,
  for_sale    boolean not null default false,
  sort_order  int not null default 0
);

-- Tetapan kedai (satu baris) — diskaun Pakej Jimat.
create table if not exists public.shop_settings (
  id                     int primary key default 1,
  pakej_discount_percent int not null default 0,
  pakej_min_items        int not null default 2,
  constraint shop_settings_single check (id = 1)
);

-- Tempahan customer (Fasa 2 guna; disediakan sekarang).
create table if not exists public.shop_orders (
  id          uuid primary key default gen_random_uuid(),
  category    text,
  full_name   text not null,
  phone       text not null,
  email       text,
  items       jsonb not null default '[]'::jsonb,
  subtotal    numeric(10,2) not null default 0,
  discount    numeric(10,2) not null default 0,
  total       numeric(10,2) not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.shop_products   enable row level security;
alter table public.shop_variants   enable row level security;
alter table public.jersey_editions enable row level security;
alter table public.shop_settings   enable row level security;
alter table public.shop_orders     enable row level security;

-- Baca: awam (anon + authenticated) untuk paparan kedai.
drop policy if exists shop_products_select on public.shop_products;
create policy shop_products_select on public.shop_products for select to anon, authenticated using (true);
drop policy if exists shop_variants_select on public.shop_variants;
create policy shop_variants_select on public.shop_variants for select to anon, authenticated using (true);
drop policy if exists jersey_editions_select on public.jersey_editions;
create policy jersey_editions_select on public.jersey_editions for select to anon, authenticated using (true);
drop policy if exists shop_settings_select on public.shop_settings;
create policy shop_settings_select on public.shop_settings for select to anon, authenticated using (true);

-- Tulis: hanya coach/admin.
drop policy if exists shop_products_write on public.shop_products;
create policy shop_products_write on public.shop_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists shop_variants_write on public.shop_variants;
create policy shop_variants_write on public.shop_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists jersey_editions_write on public.jersey_editions;
create policy jersey_editions_write on public.jersey_editions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists shop_settings_write on public.shop_settings;
create policy shop_settings_write on public.shop_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tempahan: awam boleh INSERT; coach/admin sahaja SELECT.
drop policy if exists shop_orders_insert on public.shop_orders;
create policy shop_orders_insert on public.shop_orders for insert to anon, authenticated with check (true);
drop policy if exists shop_orders_select on public.shop_orders;
create policy shop_orders_select on public.shop_orders for select to authenticated using (public.is_admin());
-- Coach/admin sah/tolak (update status) & padam tempahan.
drop policy if exists shop_orders_update on public.shop_orders;
create policy shop_orders_update on public.shop_orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists shop_orders_delete on public.shop_orders;
create policy shop_orders_delete on public.shop_orders for delete to authenticated
  using (public.is_admin());

-- ── Grants (anon perlu baca produk & insert tempahan) ───────────────────────
grant usage on schema public to anon;
grant select on public.shop_products, public.shop_variants, public.jersey_editions, public.shop_settings to anon;
grant insert on public.shop_orders to anon;
grant update, delete on public.shop_orders to authenticated;

-- ── Seed: produk tetap + tetapan ────────────────────────────────────────────
insert into public.shop_products (id, name) values
  ('jersi', 'Jersi Stingers'),
  ('hustle_gear', 'Hustle Gear')
on conflict (id) do nothing;

insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

-- ── Seed: edisi legasi (gambar guna /public sedia ada; harga 0 → admin set) ──
insert into public.jersey_editions (id, name, year, tournament, region, venue, note, image_url, sort_order) values
  ('ventralis-2025','Ventralis ed.','2025','KATMO','Petaling Perdana','Mini Turf SK Seksyen 20',null,'/images/jerseys/ventralis-2025.png',0),
  ('apicalis-2025','Apicalis ed.','2025','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/apicalis-2025.png',1),
  ('binghami-2024','Binghami ed.','2024','KATMO','Petaling Perdana','Mini Turf SK Seksyen 20',null,'/images/jerseys/binghami-2024.png',2),
  ('itama-2024','Itama ed.','2024','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/itama-2024.png',3),
  ('desaminium-girls-2024','Desaminium Girls ed.','2024','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/desaminium-girls-2024.png',4),
  ('desaminium-girls-alt-2024','Desaminium Girls alt. ed.','2024','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/desaminium-girls-alt-2024.png',5),
  ('dortmund-2023','Dortmund ed.','2023','KATMO','Petaling Perdana','Mini Turf SK Seksyen 20',null,'/images/jerseys/dortmund-2023.png',6),
  ('thoracica-2023','Thoracica ed.','2023','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/thoracica-2023.png',7),
  ('desaminium-girls-2023','Desaminium Girls ed.','2023','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/desaminium-girls-2023.png',8),
  ('stingers-desaminium-official-2022','Stingers Desaminium ed.','2022','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar','Jersi Pegawai','/images/jerseys/stingers-desaminium-official-2022.png',9),
  ('stingers-desaminium-boys-2022','Stingers Desaminium (Boys) ed.','2022','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/stingers-desaminium-boys-2022.png',10),
  ('stingers-desaminium-girls-2022','Stingers Desaminium (Girls) ed.','2022','MSSD','Petaling Perdana','Stadium Hoki KPM Bangsar',null,'/images/jerseys/stingers-desaminium-girls-2022.png',11),
  ('stingers-tournament-2022','Stingers Desaminium Tournament ed.','2022','Tournament','','','','/images/jerseys/stingers-tournament-2022.png',12)
on conflict (id) do nothing;

-- ── Storage: bucket 'shop' (gambar produk/edisi) ────────────────────────────
insert into storage.buckets (id, name, public) values ('shop', 'shop', true)
on conflict (id) do nothing;

drop policy if exists "coach upload shop" on storage.objects;
create policy "coach upload shop" on storage.objects for insert to authenticated
  with check (bucket_id = 'shop' and public.is_admin());

drop policy if exists "coach delete shop" on storage.objects;
create policy "coach delete shop" on storage.objects for delete to authenticated
  using (bucket_id = 'shop' and public.is_admin());

-- ============================================================================
-- FASA 2 — status tempahan, bukti pengesahan, QR DuitNow, notifikasi
-- ============================================================================

-- Status: 'menunggu_semakan' | 'disahkan' | 'ditolak'
alter table public.shop_orders add column if not exists status text not null default 'menunggu_semakan';
alter table public.shop_orders add column if not exists proof_url text;
-- Pautan bukti yang diarkibkan ke Google Drive selepas "Sah" (proof_url di-null
-- kan untuk jimat storan; pautan ini untuk jejak/rujukan jika ada pertikaian).
alter table public.shop_orders add column if not exists proof_drive_url text;

-- Tetapan DuitNow (QR + maklumat akaun) untuk dipapar ke pelanggan.
alter table public.shop_settings add column if not exists duitnow_qr_url text;
alter table public.shop_settings add column if not exists info_akaun text;

-- Pelanggan awam (anon) boleh muat naik BUKTI ke folder 'proof/' sahaja.
drop policy if exists "public upload order proof" on storage.objects;
create policy "public upload order proof" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'shop' and (storage.foldername(name))[1] = 'proof');

-- Notifikasi kepada admin/coach bila tempahan baharu masuk (bypass RLS).
create or replace function public.notify_admins_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, title, link, ref_type, ref_id)
  select u.clerk_user_id,
         'Tempahan baharu: ' || coalesce(new.full_name, 'Pelanggan'),
         '/portal/coach',
         'order',
         new.id::text
  from public.users u
  where u.role = 'admin';
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_new_order on public.shop_orders;
create trigger trg_notify_admins_new_order
  after insert on public.shop_orders
  for each row execute function public.notify_admins_new_order();

-- Carta saiz (gambar) setiap produk. Jersi: { lengan_pendek, lengan_panjang,
-- muslimah }. Hustle Gear: { standard }. URL gambar dalam bucket 'shop'.
alter table public.shop_products add column if not exists size_charts jsonb not null default '{}'::jsonb;

-- Cetak nombor (jersi sahaja; Hustle Gear tiada nombor).
alter table public.shop_products add column if not exists number_print_enabled boolean not null default false;
alter table public.shop_products add column if not exists number_print_fee numeric(8,2) not null default 0;

-- Material Lycra (pilihan customer +caj). lycra_enabled = tawar atau tidak.
alter table public.shop_products add column if not exists lycra_enabled boolean not null default false;
alter table public.shop_products add column if not exists lycra_surcharge numeric(8,2) not null default 0;

-- Caj tambahan per nilai (cth { "Berkolar Mandarin": 2 } / { "Zip": 3 }).
-- Harga variasi = harga asas + caj reka bentuk + caj penutup + (Lycra?) + saiz + cetak.
alter table public.shop_products add column if not exists reka_surcharges jsonb not null default '{}'::jsonb;
alter table public.shop_products add column if not exists penutup_surcharges jsonb not null default '{}'::jsonb;
-- Caj ikut lengan (cth Lengan Panjang +4). { "Pendek":0, "Panjang":4 }
alter table public.shop_products add column if not exists lengan_surcharges jsonb not null default '{}'::jsonb;

-- Jenis legasi: 'jersi' atau 'hustle_gear' (satu jadual untuk dua legasi).
alter table public.jersey_editions add column if not exists kind text not null default 'jersi';

-- Penghantaran (Pos) — kadar berasaskan berat, boleh edit admin.
alter table public.shop_settings add column if not exists pos_enabled boolean not null default false;
alter table public.shop_settings add column if not exists pos_weight_per_item_g int not null default 250;
alter table public.shop_settings add column if not exists pos_base numeric(8,2) not null default 8;
alter table public.shop_settings add column if not exists pos_base_kg numeric(6,2) not null default 1;
alter table public.shop_settings add column if not exists pos_add_per_kg numeric(8,2) not null default 2;
alter table public.shop_orders add column if not exists delivery text not null default 'pickup';
alter table public.shop_orders add column if not exists postage numeric(8,2) not null default 0;
alter table public.shop_orders add column if not exists address text;

-- ============================================================================
-- DISKAUN PELBAGAI (kombinasi) — ganti "Pakej Jimat" satu peraturan.
-- Setiap peraturan: kuantiti minimum per kategori + peratus atas subtotal.
--   requirements jsonb cth: {"jersi":2} atau {"jersi":1,"hustle_gear":1}
--   Kategori sah: jersi | hustle_gear | jersi_lama | hustle_lama
--   Bila beberapa peraturan layak, enjin ambil yang beri potongan terbesar.
-- ============================================================================
create table if not exists public.shop_discounts (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  requirements jsonb not null default '{}'::jsonb,
  percent      numeric(5,2) not null default 0,
  active       boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.shop_discounts enable row level security;
drop policy if exists shop_discounts_select on public.shop_discounts;
create policy shop_discounts_select on public.shop_discounts for select to anon, authenticated using (true);
drop policy if exists shop_discounts_write on public.shop_discounts;
create policy shop_discounts_write on public.shop_discounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.shop_discounts to anon;

-- ============================================================================
-- SOFT-DELETE TEMPAHAN (Tong Sampah 3 hari)
-- Padam tempahan = tanda `deleted_at` (bukan buang terus). Coach boleh tarik
-- balik dalam tempoh hormat; selepas 3 hari, pg_cron buang kekal.
-- (Kebenaran update/delete sedia ada — shop_orders_update/delete = is_admin.)
-- ============================================================================
alter table public.shop_orders add column if not exists deleted_at timestamptz;
create index if not exists shop_orders_deleted_at_idx on public.shop_orders (deleted_at);

-- Buang kekal selepas 3 hari, automatik dalam DB (tak perlu service key).
-- pg_cron sudah tersedia di Supabase — cuma perlu diaktifkan sekali.
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-deleted-shop-orders') then
    perform cron.unschedule('purge-deleted-shop-orders');
  end if;
end $$;

-- Jalankan 7 pagi setiap hari (selepas keep-alive 6 pagi).
select cron.schedule(
  'purge-deleted-shop-orders',
  '0 7 * * *',
  $$delete from public.shop_orders
      where deleted_at is not null
        and deleted_at < now() - interval '3 days'$$
);
