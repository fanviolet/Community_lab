# Supabase Setup — Community Project Lab

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Open **Project Settings → API**
4. Copy **Project URL** and **anon public** key

## 2. Environment variables

Copy `.env.local.example` to `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** Restart the dev server after saving (`npm run dev`). Next.js only reads env files on startup.

## 3. Auth settings (Supabase Dashboard)

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
2. **Authentication → Providers → Email** — enable Email provider
3. For local dev without email confirmation: disable **Confirm email** under Email settings

## 4. Run database schema

Open **SQL Editor** in Supabase and run the script below.

## 5. Auth flow

```
/signup → email signup → /login → /dashboard → logout → /login
```

Protected routes (middleware): `/dashboard`, `/problems`, `/discussion`, `/insights`, `/proposals`, `/workspace`, `/archive`

---

## SQL Schema

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  school text,
  role text default 'student' check (role in ('student', 'teacher', 'admin')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Problems
create table public.problems (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  status text default 'active' check (status in ('new', 'active', 'under_review', 'resolved')),
  vote_count int default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.problems enable row level security;

create policy "Problems are viewable by authenticated users"
  on public.problems for select to authenticated using (true);

create policy "Users can create problems"
  on public.problems for insert to authenticated with check (auth.uid() = author_id);

create policy "Authors can update own problems"
  on public.problems for update to authenticated using (auth.uid() = author_id);

-- Comments (discussion)
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  problem_id uuid not null references public.problems (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by authenticated users"
  on public.comments for select to authenticated using (true);

create policy "Users can create comments"
  on public.comments for insert to authenticated with check (auth.uid() = author_id);

create policy "Authors can update own comments"
  on public.comments for update to authenticated using (auth.uid() = author_id);

-- Votes
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  problem_id uuid not null references public.problems (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (problem_id, user_id)
);

alter table public.votes enable row level security;

create policy "Votes are viewable by authenticated users"
  on public.votes for select to authenticated using (true);

create policy "Users can vote"
  on public.votes for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can remove own vote"
  on public.votes for delete to authenticated using (auth.uid() = user_id);

-- Proposals
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references public.problems (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  overview text,
  goals jsonb default '[]'::jsonb,
  timeline text,
  team_notes text,
  status text default 'draft'
    check (status in ('draft','submitted','approved','rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.proposals enable row level security;

create policy "Owner can select own proposals"
  on public.proposals for select using (auth.uid() = user_id);

create policy "Public can read non-draft proposals"
  on public.proposals for select using (status != 'draft');

create policy "Owner can insert own proposals"
  on public.proposals for insert with check (auth.uid() = user_id);

create policy "Owner can update own proposals"
  on public.proposals for update using (auth.uid() = user_id);

create policy "Owner can delete own proposals"
  on public.proposals for delete using (auth.uid() = user_id);

-- Projects (workspace)
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid references public.proposals (id) on delete set null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  status text default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Projects viewable by authenticated users"
  on public.projects for select to authenticated using (true);

create policy "Users can create projects"
  on public.projects for insert to authenticated with check (auth.uid() = owner_id);

create policy "Owners can update own projects"
  on public.projects for update to authenticated using (auth.uid() = owner_id);

-- Archives
create table public.archives (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  impact_summary text,
  year int,
  team_name text,
  published_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table public.archives enable row level security;

create policy "Archives viewable by everyone"
  on public.archives for select using (true);

create policy "Project owners can create archives"
  on public.archives for insert to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id and projects.owner_id = auth.uid()
    )
  );

-- Vote count helper
create or replace function public.refresh_problem_vote_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.problems set vote_count = vote_count + 1 where id = new.problem_id;
  elsif tg_op = 'DELETE' then
    update public.problems set vote_count = vote_count - 1 where id = old.problem_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger on_vote_change
  after insert or delete on public.votes
  for each row execute procedure public.refresh_problem_vote_count();
```

---

## Packages

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Next.js App Router auth (cookies, middleware) |
| `@supabase/auth-helpers-nextjs` | Installed per project spec; use `@supabase/ssr` for new code |

## File map

| File | Role |
|------|------|
| `src/lib/supabase.ts` | Browser client |
| `src/lib/supabase-server.ts` | Server Components / Route Handlers |
| `src/lib/supabase-middleware.ts` | Session refresh in middleware |
| `src/middleware.ts` | Route protection |
| `src/app/auth/callback/route.ts` | OAuth / email confirm callback |
