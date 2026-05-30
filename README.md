# Stingers Hockey 🏑

Laman web rasmi **Stingers Hockey** — pasukan field hockey Sekolah Kebangsaan Taman Desaminium, Seri Kembangan, Selangor. Ditubuhkan 2017.

> **Strike Hard. Strike Fast.** · _Kicking Goals. Breaking Moulds._

Single-page scroll: Hero · Marquee · Tentang · Jadual Latihan · Kisah Logo · Legasi Jersi · Hustle Gear · Borang Pendaftaran · Penaja · Footer.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** (tema dalam `src/app/globals.css` melalui `@theme`)
- **Framer Motion** (animasi), **Lucide React** (ikon)
- **react-hook-form** + **zod** (borang & validation)

Tema: ink `#0A0A0A`, bg-soft `#121212`, paper `#F4F1EA`, muted `#8A8780`, amber `#F5B400`, amber-deep `#D99800`. Fonts: **Anton** (display) + **Archivo** (body).

---

## 1. Aset perlu dieksport dari Canva

Letak fail di `public/images/` dengan **nama tepat** (huruf kecil, sempang). Sebelum fail wujud, laman tunjuk placeholder gradient yang sopan — **tidak crash**.

```
public/images/
  logo.png                      logo kelulut (transparent bg)
  logo-white.png                logo putih (footer)
  hero-player.jpg               foto pemain (Gee Shariff)
  about-team.jpg                foto pasukan
  hustle-gear-2026.png          training kit 2026
  jerseys/
    ventralis-2025.png
    apicalis-2025.png
    binghami-2024.png
    itama-2024.png
    desaminium-girls-2024.png
    desaminium-girls-alt-2024.png
    dortmund-2023.png
    thoracica-2023.png
    desaminium-girls-2023.png
    stingers-desaminium-official-2022.png
    stingers-desaminium-boys-2022.png
    stingers-desaminium-girls-2022.png
    stingers-tournament-2022.png
  sponsors/
    nda-apparel.png
```

Format: PNG transparent untuk logo/jersi/penaja, JPG untuk foto. Lihat juga `public/images/README.txt`.

---

## 2. Run di local

```bash
npm install      # sekali sahaja
npm run dev      # http://localhost:3000
```

Skrip lain:

```bash
npm run build    # production build (mesti lulus sebelum deploy)
npm start        # jalankan build production
npx eslint src   # lint
```

---

## 3. Deploy ke Vercel

1. Push repo ke GitHub (sudah siap): `https://github.com/syaifulizhan/stingers-hockey`
2. Pergi ke [vercel.com/new](https://vercel.com/new), **Import** repo `stingers-hockey`.
3. Vercel auto-detect Next.js — biarkan tetapan default, klik **Deploy**.
4. Selesai. Setiap `git push` ke `main` akan auto-deploy semula.
5. Selepas dapat domain, kemas kini `SITE_URL` dalam `src/app/layout.tsx` (untuk OpenGraph & JSON-LD).

---

## 4. Borang → Google Sheet (aktif)

Setiap pendaftaran:
1. Divalidasi dengan **zod** (`src/lib/schema.ts`)
2. Dihantar dari `src/app/api/register/route.ts` ke **Google Apps Script webhook**
3. Apps Script tambah satu baris ke Google Sheet anda
4. Borang papar banner **berjaya** (atau banner **ralat** jika simpanan gagal)

> Tanpa env var `SHEETS_WEBHOOK_URL`, route pulangkan ralat 503 dan borang papar mesej gagal — data **tidak** akan hilang secara senyap.

### Langkah setup (sekali sahaja)

1. Cipta **Google Sheet** baharu (cth: "Pendaftaran Stingers 2026").
2. Dalam Sheet: **Extensions → Apps Script**.
3. Padam kod sedia ada, paste kandungan **`google-apps-script.gs`** (di root repo), klik **Save**.
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - klik **Deploy**, kemudian **Authorize** keizinan.
5. Salin **Web app URL** (berakhir dengan `/exec`).
6. Letak URL sebagai env var `SHEETS_WEBHOOK_URL`:
   - **Local:** salin `.env.local.example` → `.env.local`, isi nilai.
   - **Vercel:** Project → Settings → Environment Variables → tambah `SHEETS_WEBHOOK_URL`.
7. **Redeploy** di Vercel (atau `git push`) supaya env var dibaca.

Baris header dalam Sheet dicipta automatik pada pendaftaran pertama.

### Mahu email juga? (pilihan)

Boleh tambah notifikasi email (Resend/SendGrid) dalam `route.ts` selari dengan tulisan ke Sheet — beritahu jika perlu.

---

## Struktur projek

```
src/
├── app/
│   ├── layout.tsx          metadata SEO + JSON-LD + fonts
│   ├── page.tsx            susunan seksyen
│   ├── globals.css         tema, grain, honeycomb keyframes, utilities
│   └── api/register/route.ts
├── components/
│   ├── Navigation, Hero, Marquee, About, Training, LogoStory,
│   │   JerseyGallery, HustleGear, RegisterForm, Sponsors, Footer
│   └── ui/  Button · Card · Honeycomb · SmartImage · Reveal
└── lib/
    ├── jerseys.ts          data 13 edisi jersi
    ├── schema.ts           skema zod borang
    └── site.ts             nav links + maklumat hubungan
```
