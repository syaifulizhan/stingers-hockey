# Migration Instructions - Approval System Deployment

## ⚠️ PENTING: Sebelum Deploy ke Production

Sistem approval baru akan active selepas deploy. Tapi kita kena run migration dulu supaya data lama tetap kekal.

## 📋 Langkah-Langkah

### 1. Deploy ke Production
```bash
vercel --prod
```

### 2. Selepas Deploy Successful, Run Migration di Supabase

Pergi ke Supabase Dashboard → SQL Editor → buka query baru → paste kod dibawah:

```sql
-- Set semua existing users (profile_complete=true) jadi approved
-- Ini pastikan mereka boleh akses terus tanpa tunggu approval

UPDATE public.users
SET approval_status = 'approved'
WHERE profile_complete = true AND approval_status = 'pending';

UPDATE public.pending_approvals
SET status = 'approved', reviewed_at = now(), reviewed_by = 'system-migration'
WHERE status = 'pending'
  AND user_id IN (SELECT clerk_user_id FROM public.users WHERE profile_complete = true);
```

Run/Execute query ini.

### 3. Verify

Selepas migration run, existing users boleh login & access portal terus. Hanya pengguna BARU akan kena approve.

## 📊 Apa yang Jadi

**Sebelum Migration:**
- Existing users: `approval_status = 'pending'` (tidak boleh akses)
- New users: `approval_status = 'pending'` (tidak boleh akses)

**Selepas Migration:**
- Existing users (profile_complete=true): `approval_status = 'approved'` ✓ Boleh akses
- New users: `approval_status = 'pending'` (kena tunggu admin approve)

## ✅ Confirm

Data lama TIDAK akan dipadam. Semua maklumat existing users kekal intact. Hanya status approval yang berubah jadi approved.
