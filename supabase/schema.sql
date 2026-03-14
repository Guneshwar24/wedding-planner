-- ============================================================
-- Shaadi Brain – Supabase Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- ── whitelisted_emails ───────────────────────────────────────
-- Only emails in this list can log in
create table if not exists whitelisted_emails (
  email text primary key,
  name text,
  is_admin boolean default false,
  added_at timestamptz default now()
);

-- ── events ──────────────────────────────────────────────────
create table if not exists events (
  id text primary key,
  name text not null,
  color text not null,
  budget bigint default 0,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ── family_members ──────────────────────────────────────────
create table if not exists family_members (
  id text primary key,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- ── tasks ───────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_id text references events(id) on delete set null,
  assigned_to text references family_members(id) on delete set null,
  deadline date,
  notes text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'done')),
  created_at timestamptz default now()
);

-- ── expenses ────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount bigint not null,
  event_id text references events(id) on delete set null,
  paid_by text references family_members(id) on delete set null,
  comment text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table whitelisted_emails enable row level security;
alter table events enable row level security;
alter table family_members enable row level security;
alter table tasks enable row level security;
alter table expenses enable row level security;

-- profiles: users see their own row; admins see all
create policy "profiles_select" on profiles
  for select using (
    auth.uid() = id OR
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- whitelisted_emails: only admins can manage
create policy "whitelist_admin_all" on whitelisted_emails
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- shared tables: any authenticated user can do full CRUD
create policy "events_all" on events for all using (auth.role() = 'authenticated');
create policy "family_members_all" on family_members for all using (auth.role() = 'authenticated');
create policy "tasks_all" on tasks for all using (auth.role() = 'authenticated');
create policy "expenses_all" on expenses for all using (auth.role() = 'authenticated');

-- ============================================================
-- Helper: check whitelist before sending OTP (callable by anon)
-- ============================================================
create or replace function public.is_email_whitelisted(p_email text)
returns boolean as $$
  select exists (select 1 from whitelisted_emails where email = p_email)
$$ language sql security definer;

grant execute on function public.is_email_whitelisted(text) to anon;
grant execute on function public.is_email_whitelisted(text) to authenticated;

-- ============================================================
-- Seed Data
-- ============================================================

-- Admin email
insert into whitelisted_emails (email, name, is_admin) values
  ('humpetohaino@gmail.com', 'Admin', true)
on conflict (email) do nothing;

-- Default events
insert into events (id, name, color, budget, is_default) values
  ('sangeet',  'Sangeet',  '#E53E3E', 2000000, true),
  ('mayara',   'Mayara',   '#D69E2E', 1500000, true),
  ('varmala',  'Varmala',  '#8B6914',  500000, true),
  ('haldi',    'Haldi',    '#805AD5',  500000, true),
  ('mehandi',  'Mehandi',  '#38A169',  500000, true)
on conflict (id) do nothing;

-- Default family members
insert into family_members (id, name, phone) values
  ('anushka',   'Anushka Rathod', null),
  ('kamlesh',   'Kamlesh',        null),
  ('manoj',     'Manoj',          null),
  ('sangeeta',  'Sangeeta',       null),
  ('sharmila',  'Sharmila',       null),
  ('ananya',    'Ananya',         null),
  ('harsh',     'Harsh',          null),
  ('keshav',    'Keshav',         null)
on conflict (id) do nothing;

-- ============================================================
-- Auto-create profile on first login
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  email_val text;
  name_val text;
  admin_val boolean;
begin
  email_val := new.email;

  -- Look up display name and admin flag from whitelist
  select w.name, w.is_admin
  into name_val, admin_val
  from whitelisted_emails w
  where w.email = email_val;

  if name_val is null then
    name_val := split_part(email_val, '@', 1);
  end if;

  insert into public.profiles (id, email, name, is_admin)
  values (new.id, email_val, name_val, coalesce(admin_val, false))
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
