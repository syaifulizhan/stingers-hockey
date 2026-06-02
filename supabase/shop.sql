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

-- Variasi jersi (jenis: kolar/bulat/lycra/muslimah/lengan…) — label + harga.
create table if not exists public.shop_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.shop_products(id) on delete cascade,
  label       text not null,
  price       numeric(8,2) not null default 0,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

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
create policy shop_products_write on public.shop_products for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists shop_variants_write on public.shop_variants;
create policy shop_variants_write on public.shop_variants for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists jersey_editions_write on public.jersey_editions;
create policy jersey_editions_write on public.jersey_editions for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists shop_settings_write on public.shop_settings;
create policy shop_settings_write on public.shop_settings for all to authenticated using (public.is_coach()) with check (public.is_coach());

-- Tempahan: awam boleh INSERT; coach/admin sahaja SELECT.
drop policy if exists shop_orders_insert on public.shop_orders;
create policy shop_orders_insert on public.shop_orders for insert to anon, authenticated with check (true);
drop policy if exists shop_orders_select on public.shop_orders;
create policy shop_orders_select on public.shop_orders for select to authenticated using (public.is_coach());

-- ── Grants (anon perlu baca produk & insert tempahan) ───────────────────────
grant usage on schema public to anon;
grant select on public.shop_products, public.shop_variants, public.jersey_editions, public.shop_settings to anon;
grant insert on public.shop_orders to anon;

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
  with check (bucket_id = 'shop' and public.is_coach());

drop policy if exists "coach delete shop" on storage.objects;
create policy "coach delete shop" on storage.objects for delete to authenticated
  using (bucket_id = 'shop' and public.is_coach());
