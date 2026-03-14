-- ============================================================
-- Shaadi Brain – Supabase Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  name text not null,
  created_at timestamptz default now()
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
alter table events enable row level security;
alter table family_members enable row level security;
alter table tasks enable row level security;
alter table expenses enable row level security;

-- profiles: users can read/update their own row
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- shared tables: any authenticated user can do full CRUD
-- (this is a shared family app with a single shared data space)
create policy "events_all" on events for all using (auth.role() = 'authenticated');
create policy "family_members_all" on family_members for all using (auth.role() = 'authenticated');
create policy "tasks_all" on tasks for all using (auth.role() = 'authenticated');
create policy "expenses_all" on expenses for all using (auth.role() = 'authenticated');

-- ============================================================
-- Seed Data
-- ============================================================

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
-- Helper function: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  phone_val text;
  name_val text;
begin
  -- extract phone from email (format: {phone}@shaadi.app)
  phone_val := split_part(new.email, '@', 1);
  name_val := 'User ' || right(phone_val, 4);
  insert into public.profiles (id, phone, name)
  values (new.id, phone_val, name_val)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
