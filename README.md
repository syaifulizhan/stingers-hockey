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

## 4. Sambung borang ke servis email

Borang pendaftaran kini:
- Validasi dengan **zod** (`src/lib/schema.ts`)
- `console.log` data + POST ke `src/app/api/register/route.ts` (yang juga `console.log`)
- Tunjuk banner kejayaan

Untuk hantar email sebenar, edit `src/app/api/register/route.ts` di bahagian `// TODO`.

### Pilihan A — Resend (disyorkan)

```bash
npm install resend
```

```ts
// src/app/api/register/route.ts (selepas validation berjaya)
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "Stingers Hockey <onboarding@resend.dev>", // atau domain disahkan
  to: "hstingers@gmail.com",
  subject: `Pendaftar baharu: ${parsed.data.fullName}`,
  text: JSON.stringify(parsed.data, null, 2),
});
```

Tambah `RESEND_API_KEY` dalam **Vercel → Project → Settings → Environment Variables** (dan `.env.local` untuk local).

### Pilihan B — SendGrid

```bash
npm install @sendgrid/mail
```

```ts
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: "hstingers@gmail.com",
  from: "noreply@domain-anda.com", // mesti verified sender
  subject: `Pendaftar baharu: ${parsed.data.fullName}`,
  text: JSON.stringify(parsed.data, null, 2),
});
```

> Alternatif tanpa kod: pautkan borang ke **Google Sheet** (Apps Script webhook) atau **Formspree**.

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
