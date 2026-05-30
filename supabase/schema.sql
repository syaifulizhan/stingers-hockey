-- ============================================================================
-- Stingers Hockey — Portal Ahli: Skema Database + Keselamatan (RLS)
-- ----------------------------------------------------------------------------
-- Cara guna:
--   1. Supabase Dashboard → projek Stingers Hockey → menu kiri "SQL Editor"
--   2. Tekan "New query", paste SEMUA fail ini, tekan "Run"
--   3. Patut nampak "Success". Jadual & peraturan keselamatan siap.
--
-- Selamat untuk run berulang kali (guna IF NOT EXISTS / CREATE OR REPLACE /
-- DROP POLICY IF EXISTS) — tak akan rosakkan data sedia ada.
--
-- Identiti: kita guna ID pengguna Clerk (auth.jwt()->>'sub') sebagai pemilik
-- setiap baris. RLS pastikan: ahli nampak data sendiri; coach/admin nampak semua.
-- ============================================================================

-- ── Jadual: users (profil ahli) ─────────────────────────────────────────────
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,                 -- ID dari Clerk
  role            text not null default 'member'
                    check (role in ('member','coach','admin')),
  -- Maklumat ringkas (semasa/selepas sign up)
  full_name       text,
  email           text,
  year            text,                                 -- Tahun
  class           text,                                 -- Kelas
  -- Maklumat penuh (sama seperti borang "Sertai Skuad")
  date_of_birth   date,
  ic_number       text,
  gender          text,
  school          text,
  school_reg_no   text,
  player_phone    text,
  guardian_phone  text,
  guardian_email  text,
  experience      text,
  position        text,
  notes           text,
  -- Status
  profile_complete boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Jadual: sessions (jadual latihan) ───────────────────────────────────────
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  date        date,
  time        text,
  location    text,
  created_by  text,                                     -- clerk_user_id coach
  created_at  timestamptz not null default now()
);

-- ── Jadual: attendance (kehadiran) ──────────────────────────────────────────
create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     text not null,                            -- clerk_user_id ahli
  status      text not null default 'present'
                check (status in ('present','absent','excused')),
  recorded_by text,
  created_at  timestamptz not null default now(),
  unique (session_id, user_id)
);

-- ── Jadual: tasks (tugasan latihan) ─────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  due_date     date,
  assigned_to  text,                                    -- null = semua ahli
  created_by   text,
  created_at   timestamptz not null default now()
);

-- ── Jadual: submissions (hantaran tugasan) ──────────────────────────────────
create table if not exists public.submissions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  user_id      text not null,                           -- clerk_user_id ahli
  content      text,
  media_url    text,
  status       text not null default 'submitted'
                 check (status in ('submitted','reviewed','revise')),
  submitted_at timestamptz not null default now(),
  unique (task_id, user_id)
);

-- ── Jadual: news (pengumuman) ───────────────────────────────────────────────
create table if not exists public.news (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  image_url    text,
  author       text,
  published_at timestamptz not null default now()
);

-- ============================================================================
-- FUNGSI PEMBANTU — semak peranan pengguna semasa
-- SECURITY DEFINER supaya boleh baca jadual users tanpa terikat RLS
-- (elak gelung tak berkesudahan / recursion).
-- ============================================================================
create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt()->>'sub'
      and role in ('coach','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt()->>'sub'
      and role = 'admin'
  );
$$;

-- ============================================================================
-- LINDUNGI PERANAN — murid TAK BOLEH jadikan diri 'coach'
-- - Insert biasa (oleh pengguna login) → paksa 'member'
-- - Update biasa → tak benarkan tukar role
-- - Pengecualian: admin, atau perubahan dari Dashboard/Service (auth.jwt() null)
-- ============================================================================
create or replace function public.protect_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    if auth.jwt() is not null and not public.is_admin() then
      new.role := 'member';
    end if;
    return new;
  end if;
  if (tg_op = 'UPDATE') then
    if new.role is distinct from old.role
       and auth.jwt() is not null and not public.is_admin() then
      new.role := old.role;            -- abaikan cubaan tukar role
    end if;
    new.updated_at := now();
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_user_role on public.users;
create trigger trg_protect_user_role
  before insert or update on public.users
  for each row execute function public.protect_user_role();

-- ============================================================================
-- HIDUPKAN RLS pada semua jadual
-- ============================================================================
alter table public.users       enable row level security;
alter table public.sessions    enable row level security;
alter table public.attendance  enable row level security;
alter table public.tasks       enable row level security;
alter table public.submissions enable row level security;
alter table public.news        enable row level security;

-- ── Peraturan: users ────────────────────────────────────────────────────────
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (clerk_user_id = auth.jwt()->>'sub' or public.is_coach());

drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert to authenticated
  with check (clerk_user_id = auth.jwt()->>'sub');

drop policy if exists users_update on public.users;
create policy users_update on public.users for update to authenticated
  using (clerk_user_id = auth.jwt()->>'sub' or public.is_coach())
  with check (clerk_user_id = auth.jwt()->>'sub' or public.is_coach());

-- ── Peraturan: sessions (semua ahli baca; coach urus) ───────────────────────
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using (true);
drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for all to authenticated
  using (public.is_coach()) with check (public.is_coach());

-- ── Peraturan: attendance (ahli baca sendiri; coach urus) ───────────────────
drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance for select to authenticated
  using (user_id = auth.jwt()->>'sub' or public.is_coach());
drop policy if exists attendance_write on public.attendance;
create policy attendance_write on public.attendance for all to authenticated
  using (public.is_coach()) with check (public.is_coach());

-- ── Peraturan: tasks (ahli nampak tugasan dia/umum; coach urus) ─────────────
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (assigned_to is null or assigned_to = auth.jwt()->>'sub' or public.is_coach());
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all to authenticated
  using (public.is_coach()) with check (public.is_coach());

-- ── Peraturan: submissions (ahli urus sendiri; coach baca/semak semua) ──────
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select to authenticated
  using (user_id = auth.jwt()->>'sub' or public.is_coach());
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to authenticated
  with check (user_id = auth.jwt()->>'sub');
drop policy if exists submissions_update on public.submissions;
create policy submissions_update on public.submissions for update to authenticated
  using (user_id = auth.jwt()->>'sub' or public.is_coach())
  with check (user_id = auth.jwt()->>'sub' or public.is_coach());

-- ── Peraturan: news (semua ahli baca; coach urus) ───────────────────────────
drop policy if exists news_select on public.news;
create policy news_select on public.news for select to authenticated
  using (true);
drop policy if exists news_write on public.news;
create policy news_write on public.news for all to authenticated
  using (public.is_coach()) with check (public.is_coach());

-- ============================================================================
-- GRANTS — benarkan peranan 'authenticated' guna jadual (RLS tetap mengawal baris)
-- ============================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ============================================================================
-- STORAGE — bucket "news-images" untuk gambar berita
--   • Bucket public  → sesiapa boleh LIHAT gambar melalui pautan (untuk papar).
--   • Muat naik       → hanya coach/admin (is_coach()).
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

drop policy if exists "coach upload news images" on storage.objects;
create policy "coach upload news images" on storage.objects for insert to authenticated
  with check (bucket_id = 'news-images' and public.is_coach());

drop policy if exists "coach delete news images" on storage.objects;
create policy "coach delete news images" on storage.objects for delete to authenticated
  using (bucket_id = 'news-images' and public.is_coach());

-- ============================================================================
-- BERITA AWAM — benarkan orang awam (belum login) BACA berita untuk
-- dipaparkan di laman utama. Jadual lain kekal terlindung.
-- ============================================================================
drop policy if exists news_public_select on public.news;
create policy news_public_select on public.news for select to anon using (true);
grant usage on schema public to anon;
grant select on public.news to anon;

-- ============================================================================
-- STORAGE — bucket "task-proof" untuk bukti tugasan (gambar/video ahli)
--   • Muat naik: mana-mana ahli yang login (authenticated).
--   • Baca: public (pautan UUID rawak) — dipapar di dashboard ahli & coach.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('task-proof', 'task-proof', true)
on conflict (id) do nothing;

drop policy if exists "members upload task proof" on storage.objects;
create policy "members upload task proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'task-proof');

-- ============================================================================
-- PADAM HANTARAN — ahli boleh padam hantaran sendiri; coach boleh padam apa saja
-- ============================================================================
drop policy if exists submissions_delete on public.submissions;
create policy submissions_delete on public.submissions for delete to authenticated
  using (user_id = auth.jwt()->>'sub' or public.is_coach());

-- ============================================================================
-- NOTIFIKASI — loceng untuk ahli (hantaran disemak, berita baru, tugasan baru)
--   user_id null = broadcast untuk semua ahli.
--   "Belum baca" dikira guna users.last_seen_notifications.
-- ============================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     text,                       -- null = semua ahli
  title       text not null,
  body        text,
  link        text,
  created_at  timestamptz not null default now()
);
alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id is null or user_id = auth.jwt()->>'sub');

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated
  with check (public.is_coach());

alter table public.users add column if not exists last_seen_notifications timestamptz;

grant select, insert on public.notifications to authenticated;

-- ============================================================================
-- BAN AHLI + NOTIFIKASI ADMIN
-- ============================================================================
-- Lajur status ban
alter table public.users add column if not exists banned boolean not null default false;

-- Storage: coach/admin boleh padam fail bukti (cleanup semasa ban)
drop policy if exists "coach delete task proof" on storage.objects;
create policy "coach delete task proof" on storage.objects for delete to authenticated
  using (bucket_id = 'task-proof' and public.is_coach());

-- Notifikasi admin bila ada PENDAFTARAN BAHARU (trigger; bypass RLS via definer)
create or replace function public.notify_admins_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, title, link)
  select u.clerk_user_id,
         'Pendaftaran baharu: ' || coalesce(new.full_name, 'Ahli'),
         '/portal/coach'
  from public.users u
  where u.role = 'admin' and u.clerk_user_id <> new.clerk_user_id;
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_new_user on public.users;
create trigger trg_notify_admins_new_user
  after insert on public.users
  for each row execute function public.notify_admins_new_user();
