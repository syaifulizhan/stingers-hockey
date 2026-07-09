# Domain Allowlist — Sistem Kelulusan Pendaftaran

## Apa itu Domain Allowlist?

Domain allowlist membolehkan admin/coach untuk mengawal pendaftaran pengguna dari domain email tertentu (cth: `gpi.edu.my`). Pengguna dari domain yang berada dalam senarai putih perlu diluluskan oleh admin/coach sebelum boleh menggunakan portal sepenuhnya.

## Aliran

1. **Pendaftaran Pengguna**: Pengguna mendaftar & melengkap profil
2. **Semak Domain**: Sistem semak jika domain email mereka dalam allowlist
3. **Tetapkan Status**:
   - Jika domain dalam allowlist → `approval_status = 'pending'`
   - Jika tidak → `approval_status = 'approved'`
4. **Buat Pending Record**: Jika pending, buat record dalam jadual `pending_approvals`
5. **Admin/Coach Luluskan**: Admin/coach lihat pending approval dan pilih untuk luluskan atau tolak
6. **Pengguna Boleh Login**: Selepas diluluskan, pengguna boleh akses portal penuh

## Cara Guna

### Untuk Admin/Coach: Tambah Domain ke Allowlist

Pergi ke `/portal/admin/allowlist` (hanya admin/coach):

1. Buka tab "Domain"
2. Masukkan domain (cth: `gpi.edu.my`)
3. Klik "Tambah"
4. Domain akan muncul dalam senarai

### Untuk Admin/Coach: Luluskan Pendaftaran

Di halaman yang sama, tab "Pending Approval":

1. Lihat senarai pengguna yang menunggu kelulusan
2. Klik "Luluskan" atau "Tolak"
3. Pengguna akan dapat notifikasi status mereka

### Untuk Pengguna: Semak Status Kelulusan

Jika pendaftaran anda menunggu kelulusan:

1. Anda akan diarahkan ke `/portal/approval-pending`
2. Lihat maklumat pendaftaran & domain anda
3. Tunggu admin/coach untuk meluluskan

## Database Schema

### Jadual: `domain_allowlist`
```sql
- id (UUID): ID unik
- domain (text): Domain email (cth: gpi.edu.my)
- created_by (text): Clerk user ID admin/coach
- created_at (timestamp): Tarikh ditambah
```

### Jadual: `pending_approvals`
```sql
- id (UUID): ID unik
- user_id (text): Clerk user ID pengguna (FK to users.clerk_user_id)
- domain (text): Domain email
- status (text): 'pending' | 'approved' | 'rejected'
- requested_at (timestamp): Tarikh pendaftaran
- reviewed_by (text): Clerk user ID admin/coach
- reviewed_at (timestamp): Tarikh kelulusan/penolakan
- note (text): Catatan (cth alasan tolak)
```

### Jadual: `users` — Lajur Baru
```sql
- approval_status (text): 'pending' | 'approved' | 'rejected'
  (default: 'approved' — hanya 'pending' jika domain dalam allowlist)
```

## API Endpoints

### GET `/api/portal/admin/allowlist`
Dapatkan senarai domain allowlist (semua orang boleh baca).

**Response:**
```json
{
  "domains": [
    {
      "id": "uuid",
      "domain": "gpi.edu.my",
      "created_by": "clerk_id",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/portal/admin/allowlist`
Tambah domain baru (hanya admin).

**Body:**
```json
{
  "domain": "gpi.edu.my"
}
```

### DELETE `/api/portal/admin/allowlist`
Buang domain dari senarai (hanya admin).

**Body:**
```json
{
  "domain": "gpi.edu.my"
}
```

### GET `/api/portal/admin/pending-approvals`
Dapatkan senarai pending approval (hanya admin/coach).

**Response:**
```json
{
  "pending": [
    {
      "id": "uuid",
      "user_id": "clerk_id",
      "domain": "gpi.edu.my",
      "status": "pending",
      "requested_at": "2026-01-01T00:00:00Z",
      "user": {
        "full_name": "NAMA PENUH",
        "email": "nama@gpi.edu.my",
        "school": "SEKOLAH"
      }
    }
  ]
}
```

### POST `/api/portal/admin/pending-approvals`
Luluskan atau tolak pendaftaran (hanya admin/coach).

**Body:**
```json
{
  "approvalId": "uuid",
  "action": "approve" | "reject",
  "note": "Catatan (optional)"
}
```

## Alur Teknikal

1. **Pendaftaran**: `POST /api/portal/profile`
   - Ambil email dari Clerk
   - Ekstrak domain dari email
   - Semak jika domain ada dalam `domain_allowlist`
   - Jika ada → set `approval_status = 'pending'`
   - Buat record dalam `pending_approvals`

2. **Kelulusan**: `POST /api/portal/admin/pending-approvals`
   - Update `pending_approvals.status` ke 'approved' atau 'rejected'
   - Update `users.approval_status` ke status yang sama
   - Jika rejected, pengguna tidak boleh akses portal

3. **Portal Access**: Middleware `PortalApprovalGuard`
   - Semak `users.approval_status` pada setiap akses portal
   - Jika 'pending' → redirect ke `/portal/approval-pending`
   - Jika 'rejected' → show error message

## Contoh Penggunaan

### Skenario 1: Pendaftaran dari GPI (Gawai Permata Indonesia)

1. Tambah `gpi.edu.my` ke allowlist
2. Pengguna dari GPI mendaftar dengan email `nama@gpi.edu.my`
3. Sistem detect domain, set status = 'pending'
4. Admin/coach lihat pending approval
5. Admin/coach klik "Luluskan"
6. Pengguna dapat akses portal

### Skenario 2: Pendaftaran dari Domain Umum

1. Domain umum (`gmail.com`, `yahoo.com`) TIDAK dalam allowlist
2. Pengguna mendaftar dengan email `nama@gmail.com`
3. Sistem detect domain TIDAK dalam senarai, set status = 'approved'
4. Pengguna terus dapat akses portal tanpa espera
