# Allowlist Portal

Siapa yang dibenarkan masuk portal ahli — dan bagaimana ia dikuatkuasakan.

## Ringkasan

Portal ini **tertutup secara lalai**. Sign up di Clerk sahaja tidak memberi
apa-apa akses. Seseorang hanya boleh masuk jika **salah satu** benar:

| Cara | Untuk siapa | Diurus di mana |
|---|---|---|
| `PORTAL_ADMIN_EMAILS` (env) | Anda sendiri / admin sistem | Vercel → Environment Variables |
| `PORTAL_ALLOWED_EMAILS` (env) | Jaring kecemasan jika DB tumbang | Vercel → Environment Variables |
| Jadual `allowlist_emails` | Pra-kelulusan pukal (cth. satu skuad) | Portal → Jurulatih → Allowlist |
| `users.approval_status = 'approved'` | Kelulusan seorang demi seorang | Portal → Jurulatih → Allowlist |

Semua yang lain dihalakan ke `/portal/approval-pending` dan **tidak dapat
membaca apa-apa data** — bukan sekadar tidak nampak butang.

## Tiga lapis penguatkuasaan

Kelulusan diperiksa tiga kali, di tiga tempat berbeza. Melangkau satu lapisan
tidak memberi apa-apa, kerana dua lagi masih berdiri.

1. **`src/proxy.ts`** — default deny. Setiap laluan di bawah `/portal` dan
   `/api/portal` menuntut log masuk, kecuali `/portal`, `/portal/sign-in`,
   `/portal/sign-up`. Ini semakan *optimistic* sahaja: ia tahu anda log masuk,
   bukan sama ada anda diluluskan.

2. **`src/lib/portal-guard.ts`** — gate sebenar, berjalan di server.
   - Page: `requireApprovedPage()`, `requireCoachPage()`, `requireAdminPage()`
   - Route: `requireApprovedApi()`, `requireCoachApi()`, `requireAdminApi()`

   Ia dipanggil **sebelum** sebarang data disentuh, jadi tiada apa-apa yang
   bocor melalui RSC payload. Peraturannya: **gagal = tolak**. Jika Supabase
   tidak dapat dihubungi, jika lajur hilang, jika apa-apa melencong —
   pengguna TIDAK diluluskan.

3. **RLS Supabase** — `public.is_approved()`. Walaupun seseorang memintas
   keseluruhan aplikasi dan bercakap terus dengan Supabase menggunakan anon
   key + token Clerk mereka sendiri, pangkalan data memulangkan kosong.
   Lihat `supabase/migrations/20260819_allowlist_enforcement.sql`.

## Aliran pengguna baharu

1. Sign up melalui Clerk.
2. Gate mencipta baris `users` (`approval_status = 'pending'`) **dan** rekod
   `pending_approvals` serentak — supaya tiada pengguna yang wujud dalam DB
   tetapi tidak kelihatan di panel admin.
3. Onboarding (`/portal/onboarding`) **sengaja dibuka** kepada pengguna
   pending: borang itulah yang memberi admin nama, sekolah dan emel untuk
   membuat keputusan.
4. Semua laluan lain → `/portal/approval-pending`.
5. Admin/jurulatih pergi ke **Portal → Jurulatih → tab Allowlist** (atau
   terus ke `/portal/admin/allowlist`) dan menekan **Luluskan** atau **Tolak**.
6. Halaman "menunggu kelulusan" menyemak setiap 2 saat, jadi pengguna masuk
   sendiri tanpa perlu log masuk semula.

## Pra-kelulusan pukal

Daripada meluluskan seorang demi seorang, tampal senarai emel (dipisah koma
atau baris baharu) ke dalam kotak **Emel Dibenarkan**. Kesannya:

- Sesiapa yang **sudah** mendaftar dengan emel itu diluluskan serta-merta.
- Sesiapa yang mendaftar **kemudian** diluluskan automatik pada log masuk pertama.

Membuang emel dari senarai **tidak** menarik balik kelulusan sedia ada — untuk
itu gunakan **Tolak**, supaya menarik akses sentiasa satu keputusan yang jelas
dan bukan kesan sampingan. Menolak seseorang turut membuang emelnya dari
allowlist, jika tidak gate akan meluluskannya semula pada log masuk berikutnya.

## Pemasangan

### 1. Env (Vercel + `.env.local`)

```
SUPABASE_SERVICE_ROLE_KEY=…   # WAJIB — gate tidak berfungsi tanpanya
PORTAL_ADMIN_EMAILS=emel-anda@contoh.com
PORTAL_ALLOWED_EMAILS=        # pilihan
```

`SUPABASE_SERVICE_ROLE_KEY` adalah **wajib**. Tanpanya `createSupabaseAdmin()`
melontar ralat, gate menolak semua orang kecuali `PORTAL_ADMIN_EMAILS`, dan
portal berkesan tertutup. Sentiasa tetapkan `PORTAL_ADMIN_EMAILS` supaya anda
tidak boleh terkunci di luar portal sendiri.

### 2. Migrasi SQL

Jalankan `supabase/migrations/20260819_allowlist_enforcement.sql` di
**Supabase Dashboard → SQL Editor**. Ia idempoten — selamat dijalankan
berulang kali. Ia:

- mencipta jadual `allowlist_emails`
- mencipta `public.is_approved()`, dan menambah syarat kelulusan pada
  `is_coach()` / `is_admin()`
- mengetatkan polisi RLS supaya `authenticated` sahaja tidak mencukupi
- menambah polisi INSERT pada `pending_approvals` yang sebelum ini **hilang**
  (RLS senyap-senyap menolak setiap insert, jadi sign up baharu tidak pernah
  muncul di panel admin)
- menampung pengguna sedia ada yang tiada rekod `pending_approvals`
- menyelaraskan status yang tidak sepadan antara `users` dan `pending_approvals`

Polisi `to anon` (papan skor awam, berita awam) tidak disentuh.

## API

| Endpoint | Kaedah | Siapa | Guna |
|---|---|---|---|
| `/api/portal/admin/allowlist` | GET | jurulatih/admin | senarai emel dibenarkan |
| `/api/portal/admin/allowlist` | POST | jurulatih/admin | tambah emel `{ email, note? }` |
| `/api/portal/admin/allowlist` | DELETE | jurulatih/admin | buang emel `{ email }` |
| `/api/portal/admin/pending-approvals` | GET | jurulatih/admin | senarai menunggu |
| `/api/portal/admin/pending-approvals` | POST | jurulatih/admin | `{ approvalId, action, note? }` |

## Menambah laluan portal baharu

`proxy.ts` kini default-deny, jadi laluan baharu **dilindungi secara automatik**
— tiada apa-apa yang perlu didaftarkan. Yang masih perlu anda buat:

- Page server → panggil `requireApprovedPage()` (atau varian coach/admin)
  sebagai baris **pertama**, sebelum sebarang query.
- Route handler → `const gate = await requireApprovedApi(); if (!gate.ok) return gate.response;`

Jika anda terlupa, RLS masih menghalang kebocoran data — tetapi pengguna akan
melihat halaman kosong dan bukan mesej yang betul.
