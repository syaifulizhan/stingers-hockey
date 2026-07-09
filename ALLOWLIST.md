# Sistem Kelulusan Pendaftaran

## Apa itu Sistem Kelulusan?

Semua pengguna yang baru sign up perlu diluluskan oleh admin/coach sebelum boleh menggunakan portal sepenuhnya. Sistem ini memastikan hanya pengguna yang diluluskan boleh akses.

## Aliran

1. **Pendaftaran Pengguna**: Pengguna mendaftar & melengkap profil
2. **Auto-Pending**: Sistem auto-set `approval_status = 'pending'` untuk semua pengguna baru
3. **Buat Pending Record**: Buat record dalam jadual `pending_approvals`
4. **Admin/Coach Luluskan**: Admin/coach lihat pending approval dan pilih untuk luluskan atau tolak
5. **Pengguna Boleh Login**: Selepas diluluskan, pengguna boleh akses portal penuh

## Cara Guna

### Untuk Admin/Coach: Luluskan Pendaftaran

Pergi ke `/portal/admin/allowlist` (hanya admin/coach):

1. Lihat senarai semua pengguna yang menunggu kelulusan
2. Setiap pengguna menunjukkan:
   - Nama penuh
   - Email
   - Sekolah
   - Tarikh pendaftaran
3. Klik "Luluskan" untuk approve atau "Tolak" untuk reject
4. Pengguna akan dapat notifikasi status mereka

### Untuk Pengguna: Semak Status Kelulusan

Jika pendaftaran anda menunggu kelulusan:

1. Anda akan diarahkan ke `/portal/approval-pending`
2. Lihat maklumat pendaftaran anda
3. Tunggu admin/coach untuk meluluskan

## Database Schema

### Jadual: `pending_approvals`
```sql
- id (UUID): ID unik
- user_id (text): Clerk user ID pengguna (FK to users.clerk_user_id)
- status (text): 'pending' | 'approved' | 'rejected'
- requested_at (timestamp): Tarikh pendaftaran
- reviewed_by (text): Clerk user ID admin/coach
- reviewed_at (timestamp): Tarikh kelulusan/penolakan
- note (text): Catatan (cth alasan tolak)
```

### Jadual: `users` — Lajur Baru
```sql
- approval_status (text): 'pending' | 'approved' | 'rejected'
  (default: 'pending' — semua pengguna baru set pending)
```

## API Endpoints

### GET `/api/portal/admin/pending-approvals`
Dapatkan senarai semua pending approval (hanya admin/coach).

**Response:**
```json
{
  "pending": [
    {
      "id": "uuid",
      "user_id": "clerk_id",
      "status": "pending",
      "requested_at": "2026-01-01T00:00:00Z",
      "reviewed_by": null,
      "reviewed_at": null,
      "note": null,
      "user": {
        "full_name": "NAMA PENUH",
        "email": "nama@gmail.com",
        "school": "SEKOLAH",
        "profile_complete": true,
        "created_at": "2026-01-01T00:00:00Z"
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

**Response:**
```json
{
  "ok": true,
  "status": "approved" | "rejected"
}
```

## Alur Teknikal

1. **Pendaftaran**: `POST /api/portal/profile`
   - Pengguna melengkap profil
   - Auto-set `approval_status = 'pending'` untuk SEMUA pengguna baru
   - Buat record dalam `pending_approvals` dengan status 'pending'

2. **Kelulusan**: `POST /api/portal/admin/pending-approvals`
   - Admin/coach klik "Luluskan" atau "Tolak"
   - Update `pending_approvals.status` ke 'approved' atau 'rejected'
   - Update `users.approval_status` ke status yang sama
   - Set `reviewed_by` (admin/coach ID) dan `reviewed_at` (timestamp)

3. **Portal Access**: Middleware `PortalApprovalGuard`
   - Semak `users.approval_status` pada setiap akses portal
   - Jika 'pending' → redirect ke `/portal/approval-pending`
   - Jika 'approved' → allow akses penuh
   - Jika 'rejected' → show error message

## Contoh Penggunaan

### Skenario: Pendaftaran Baru

1. Pengguna sign up dengan email apapun (gmail, yahoo, gpi.edu.my, etc)
2. Melengkap profil di `/portal/profile`
3. Sistem auto-set status = 'pending', buat record di `pending_approvals`
4. Pengguna diarahkan ke `/portal/approval-pending` (tunggu approval)
5. Admin/coach pergi ke `/portal/admin/allowlist`
6. Admin/coach klik "Luluskan"
7. `users.approval_status` berubah jadi 'approved'
8. Pengguna refresh portal, dapat akses penuh
