# Slot Tempahan — buka pusingan baharu tanpa memadam yang lama

Bila satu pusingan tempahan sudah selesai (baju sampai ke tangan pelanggan) dan
anda mahu buka slot baharu, **jangan padam tempahan lama**. Padam bermakna:
`pg_cron` membuangnya kekal selepas 3 hari, dan rekod saiz, harga, nombor telefon
serta jejak bukti bayaran hilang bersama — termasuk untuk pertikaian yang muncul
kemudian.

Sistem slot menyelesaikannya dengan penanda: setiap tempahan dicop dengan slotnya.
Buka slot baharu = tukar penanda. Panel coach menunjukkan slot semasa; slot lama
berpindah ke arkib, sentiasa boleh dilihat semula.

---

## Urutan pelaksanaan

### 1. Backup dahulu — sebelum sentuh apa-apa

Portal → **Tempahan** → butang **Backup JSON**.

Failnya merangkumi **setiap slot, termasuk Tong Sampah**, dengan struktur `items`
utuh. CSV meratakan item jadi ia bukan backup — JSON ini sahaja yang boleh
memulihkan rekod tempahan. Simpan ke Google Drive.

Ambil juga CSV yang anda perlukan untuk pusingan yang baru selesai: **Senarai
Susun** dan **Jana Pivot** (Jersi / Hustle / Koleksi Lama).

### 2. Jalankan migrasi — SEBELUM deploy kod

Supabase Dashboard → SQL Editor → jalankan
`supabase/migrations/20260819_shop_slots.sql`.

Migrasi ini **menambah sahaja**: tiada baris dipadam, tiada tingkah laku berubah.
Ia mencop semua tempahan sedia ada sebagai `slot-1` dan menjadikannya slot semasa,
jadi kedai berjalan persis seperti sebelum ini sehingga anda menekan butang di
langkah 4.

Migrasi dahulu, kemudian deploy. Terbalik pun panel tidak rosak — ia cuma tidak
menunjukkan slot langsung (semua tempahan jatuh ke kumpulan "Tanpa slot") dan
butang Buka Slot Baharu akan gagal sehingga SQL dijalankan. Migrasi dahulu
bermakna ciri slot terus berfungsi pada saat kod mendarat.

Semak selepas jalankan:

```sql
select batch, count(*) from public.shop_orders group by batch;
select * from public.shop_batches;
select current_batch from public.shop_settings where id = 1;
```

Jangkaan: semua tempahan `slot-1`, satu baris slot, `current_batch = 'slot-1'`.

### 3. Deploy kod

```bash
vercel --prod
```

Buka Portal → Tempahan. Pemilih **Slot** muncul dengan `Slot 1 · semasa (n)`.
Senarai, Senarai Susun dan Pivot semuanya mengikut slot yang dipilih.

### 4. Buka slot baharu

Portal → Tempahan → **Urus Tempahan Pasukan** → kad **Slot Tempahan**.
Taip nama (cth `Slot 2 · Jersi 2026/27`) → **Buka Slot Baharu** → sahkan.

Yang berlaku, dalam satu transaksi:

- slot semasa ditutup (`closed_at`) dan masuk arkib;
- slot baharu dicipta dan menjadi slot semasa;
- tempahan yang masuk selepas ini dicop dengan slot baharu.

Tempahan lama tidak disentuh langsung. Ia ada di bawah pemilih Slot, bila-bila masa.

### 5. Sediakan kedai untuk slot baharu

Ikut senarai semak dalam kad Slot Tempahan:

1. Variasi jersi musim lepas — **matikan** (butang Aktif), jangan padam. Rekod
   tempahan lama merujuk labelnya; padam variasi menjadikan rekod lama mengelirukan.
   (Harga dalam tempahan lama selamat: `items` menyimpan snapshot harga seunit,
   jadi menukar harga hari ini tidak mengubah rekod semalam.)
2. Jersi yang tamat pusingan → turun ke **Legasi Jersi**, tanda "boleh beli" jika
   ada stok cetak semula.
3. Semak harga asas, caj saiz/cetak, peraturan diskaun, kadar pos, QR DuitNow.
4. Buka `/tempahan` sebagai orang awam dan buat satu tempahan ujian.

### 6. Bersihkan storan (bila-bila selepas ini)

Kad **Penyelenggaraan Storan** → **Semak Fail Yatim**.

Bukti bayaran dimuat naik sebelum baris tempahan wujud, jadi borang yang gagal
separuh jalan meninggalkan fail tanpa pemilik; `pg_cron` pula tidak boleh sentuh
Storage bila ia membuang tempahan. Butang ini mencari fail dalam `shop/proof/`
yang **tiada satu pun** tempahan merujuknya.

Dua jaring keselamatan: fail yang dirujuk oleh tempahan dalam Tong Sampah tidak
dikira yatim, dan fail berusia kurang 24 jam dilangkau (melindungi muat naik yang
sedang berjalan). Gambar produk & QR tidak berada dalam `proof/`, jadi tidak
tersentuh. Pratonton dahulu, baru buang.

---

## Ujian yang perlu dibuat sendiri

Jangan hanya tengok UI nampak betul — uji sebagai pihak yang sepatutnya ditolak.

| Ujian | Cara | Jangkaan |
|---|---|---|
| Bukan admin tak boleh buka slot | Log masuk sebagai ahli biasa, panggil `supabase.rpc('open_shop_slot', …)` dari konsol pelayar | Ralat `Hanya admin boleh buka slot tempahan.` |
| Awam tak boleh pilih slot sendiri | POST terus ke Supabase REST `shop_orders` dengan `batch: 'slot-1'` | Baris masuk dengan `batch` = slot **semasa**, bukan yang dihantar |
| Tempahan baharu masuk slot betul | Buat tempahan ujian di `/tempahan` | Muncul di bawah slot semasa, bukan arkib |
| Pivot tidak bercampur | Pilih slot baharu → Jana Pivot | Hanya tempahan slot itu; tempahan slot lama tiada |
| Tiada rekod hilang | Pemilih Slot → **Semua slot** | Jumlah = jumlah tempahan sebelum migrasi |

Jika RPC melaporkan "function not found" sebaik selepas migrasi, muat semula
cache skema PostgREST: `notify pgrst, 'reload schema';`

---

## Nota teknikal

- **Cop slot dibuat dalam DB**, oleh trigger `trg_stamp_order_batch` — bukan dalam
  kod app. Mana-mana laluan insert (borang awam, SQL Editor, skrip masa depan)
  mendapat cop yang betul tanpa perlu diingat, dan bukan-admin tidak boleh memilih
  slotnya sendiri.
- **Tempahan tanpa slot tidak pernah disembunyikan.** Jika ada baris dengan `batch`
  kosong, pemilih memaparkan kumpulan "Tanpa slot" berserta bilangannya.
- **Tong Sampah merentas semua slot** — ia bertempoh 3 hari dan tidak sepatutnya
  tersembunyi di belakang penapis slot.
- **Notifikasi kini ikut tempahan ke kubur.** `notifications.ref_id` tiada foreign
  key, jadi purge `pg_cron` dahulunya meninggalkan notifikasi menuding ke rekod
  yang sudah tiada. Trigger `trg_cleanup_order_notifications` menutupnya untuk
  semua laluan padam; migrasi turut membersihkan yang sudah yatim.
