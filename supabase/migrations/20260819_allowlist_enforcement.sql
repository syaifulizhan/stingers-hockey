-- ============================================================================
-- ALLOWLIST — PENGUATKUASAAN SEBENAR (2026-08-19)
--
-- Sebelum ini `approval_status` hanya diperiksa oleh JavaScript di pelayar.
-- Migrasi ini memindahkan penguatkuasaan ke dalam pangkalan data: pengguna
-- yang belum diluluskan tidak akan dapat membaca apa-apa, walaupun mereka
-- memintas seluruh aplikasi dan bercakap terus dengan Supabase menggunakan
-- anon key + token Clerk mereka sendiri.
--
-- Selamat dijalankan berulang kali (idempoten).
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SEMAKAN PRA-TERBANG — JALANKAN INI DAHULU, SENDIRIAN.
-- Ia hanya MEMBACA. Ia tidak mengubah apa-apa.
--
-- Migrasi di bawah menjadikan is_coach()/is_admin() menuntut kelulusan. Jika
-- mana-mana jurulatih atau admin anda BUKAN 'approved', mereka akan hilang
-- kuasa sehingga diluluskan. Semak dahulu:
--
--   select role, approval_status, count(*)
--   from public.users
--   group by role, approval_status
--   order by role, approval_status;
--
-- Jika ada baris role='coach'/'admin' dengan approval_status bukan 'approved',
-- luluskan mereka dahulu (gantikan emel dengan yang sebenar):
--
--   update public.users set approval_status = 'approved'
--   where role in ('coach','admin') and email in ('emel-anda@contoh.com');
--
-- Tetapkan juga PORTAL_ADMIN_EMAILS di Vercel — dengan itu gate akan
-- memulihkan sendiri peranan admin anda pada log masuk berikutnya.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. Jadual allowlist email (pra-kelulusan, diurus dalam app) ─────────────
-- Email di sini diluluskan automatik sebaik mereka log masuk kali pertama.
create table if not exists public.allowlist_emails (
  email      text primary key,
  added_by   text,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.allowlist_emails enable row level security;

-- Hanya coach/admin boleh lihat & urus allowlist. App guna service role,
-- jadi polisi ini semata-mata pertahanan berlapis.
drop policy if exists allowlist_emails_read on public.allowlist_emails;
create policy allowlist_emails_read on public.allowlist_emails
  for select to authenticated using (public.is_coach());

drop policy if exists allowlist_emails_write on public.allowlist_emails;
create policy allowlist_emails_write on public.allowlist_emails
  for all to authenticated using (public.is_coach()) with check (public.is_coach());

-- ── 2. Fungsi pembantu: adakah pengguna semasa DILULUSKAN? ──────────────────
-- SECURITY DEFINER supaya boleh baca `users` tanpa terperangkap dalam RLS.
create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt()->>'sub'
      and approval_status = 'approved'
  );
$$;

-- is_coach/is_admin kini turut menuntut kelulusan — seorang 'coach' yang
-- ditolak tidak boleh menggunakan kuasa coach.
create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt()->>'sub'
      and role in ('coach','admin')
      and approval_status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt()->>'sub'
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

-- ── 3. Ketatkan RLS: setiap bacaan 'authenticated' menuntut kelulusan ───────
-- Polisi `to anon` (papan skor awam, berita awam) TIDAK disentuh.

-- users: baris sendiri sentiasa boleh dibaca (halaman "menunggu kelulusan"
-- perlu tahu statusnya sendiri). Selebihnya perlu coach yang diluluskan.
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (clerk_user_id = auth.jwt()->>'sub' or public.is_coach());

-- Pengguna hanya boleh kemas kini baris sendiri SELEPAS diluluskan
-- (kecuali coach). Ini menghalang pending user menulis data.
drop policy if exists users_update on public.users;
create policy users_update on public.users for update to authenticated
  using ((clerk_user_id = auth.jwt()->>'sub' and public.is_approved()) or public.is_coach())
  with check ((clerk_user_id = auth.jwt()->>'sub' and public.is_approved()) or public.is_coach());

-- sessions
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using (public.is_approved());

-- news (ahli diluluskan sahaja; polisi anon news_public_select kekal berasingan)
drop policy if exists news_select on public.news;
create policy news_select on public.news for select to authenticated
  using (public.is_approved());

-- tasks
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (public.is_approved()
         and (assigned_to is null or assigned_to = auth.jwt()->>'sub' or public.is_coach()));

-- attendance
drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance for select to authenticated
  using (public.is_approved()
         and (user_id = auth.jwt()->>'sub' or public.is_coach()));

-- submissions
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select to authenticated
  using (public.is_approved()
         and (user_id = auth.jwt()->>'sub' or public.is_coach()));

drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to authenticated
  with check (user_id = auth.jwt()->>'sub' and public.is_approved());

drop policy if exists submissions_update on public.submissions;
create policy submissions_update on public.submissions for update to authenticated
  using ((user_id = auth.jwt()->>'sub' and public.is_approved()) or public.is_coach())
  with check ((user_id = auth.jwt()->>'sub' and public.is_approved()) or public.is_coach());

-- assessments / fitness_tests
drop policy if exists assessments_select on public.assessments;
create policy assessments_select on public.assessments for select to authenticated
  using (public.is_approved()
         and (user_id = auth.jwt()->>'sub' or public.is_coach()));

drop policy if exists fitness_select on public.fitness_tests;
create policy fitness_select on public.fitness_tests for select to authenticated
  using (public.is_approved()
         and (user_id = auth.jwt()->>'sub' or public.is_coach()));

-- seasons / matches / match_stats / achievements
-- (papan skor awam kekal terbuka melalui polisi `to anon` yang berasingan)
drop policy if exists seasons_select on public.seasons;
create policy seasons_select on public.seasons for select to authenticated
  using (public.is_approved());

drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches for select to authenticated
  using (public.is_approved());

drop policy if exists match_stats_select on public.match_stats;
create policy match_stats_select on public.match_stats for select to authenticated
  using (public.is_approved()
         and (user_id = auth.jwt()->>'sub' or public.is_coach()));

drop policy if exists achievements_select on public.achievements;
create policy achievements_select on public.achievements for select to authenticated
  using (public.is_approved());

-- notifications / push_subscriptions: milik sendiri, perlu diluluskan
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
  using (public.is_approved()
         and (user_id = auth.jwt()->>'sub' or user_id is null or public.is_coach()));

-- ── 4. pending_approvals: polisi INSERT yang hilang ─────────────────────────
-- Tanpa ini, RLS senyap-senyap menolak setiap insert dari 'authenticated',
-- jadi sign up baharu tidak pernah muncul di panel admin.
drop policy if exists pending_insert on public.pending_approvals;
create policy pending_insert on public.pending_approvals for insert to authenticated
  with check (user_id = auth.jwt()->>'sub');

grant select, insert, update, delete on public.allowlist_emails to authenticated;

-- ── 5. Tampung pengguna sedia ada yang tiada rekod pending_approvals ────────
-- Mereka wujud dalam `users` tetapi tidak pernah kelihatan di panel admin.
insert into public.pending_approvals (user_id, status, requested_at)
select u.clerk_user_id,
       case when u.approval_status = 'approved' then 'approved'
            when u.approval_status = 'rejected' then 'rejected'
            else 'pending' end,
       coalesce(u.created_at, now())
from public.users u
where not exists (
  select 1 from public.pending_approvals p where p.user_id = u.clerk_user_id
)
on conflict (user_id) do nothing;

-- ── 6. Selaraskan status yang tak sepadan antara dua jadual ─────────────────
update public.pending_approvals p
set status = u.approval_status
from public.users u
where p.user_id = u.clerk_user_id
  and p.status is distinct from u.approval_status;
