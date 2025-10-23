-- Create burger_places table
create table if not exists public.burger_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  created_by text not null check (created_by in ('Lolo', 'David')),
  created_at timestamp with time zone default now()
);

-- Create ratings table
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  burger_place_id uuid not null references public.burger_places(id) on delete cascade,
  user_name text not null check (user_name in ('Lolo', 'David')),
  meat_rating integer not null check (meat_rating >= 0 and meat_rating <= 5),
  cheese_rating integer not null check (cheese_rating >= 0 and cheese_rating <= 5),
  juiciness_rating integer not null check (juiciness_rating >= 0 and juiciness_rating <= 5),
  bread_rating integer not null check (bread_rating >= 0 and bread_rating <= 5),
  sauce_rating integer not null check (sauce_rating >= 0 and sauce_rating <= 5),
  created_at timestamp with time zone default now(),
  unique(burger_place_id, user_name)
);

-- Enable RLS
alter table public.burger_places enable row level security;
alter table public.ratings enable row level security;

-- Policies for burger_places (anyone can read and write)
create policy "burger_places_select_all"
  on public.burger_places for select
  using (true);

create policy "burger_places_insert_all"
  on public.burger_places for insert
  with check (true);

create policy "burger_places_update_all"
  on public.burger_places for update
  using (true);

create policy "burger_places_delete_all"
  on public.burger_places for delete
  using (true);

-- Policies for ratings (anyone can read and write)
create policy "ratings_select_all"
  on public.ratings for select
  using (true);

create policy "ratings_insert_all"
  on public.ratings for insert
  with check (true);

create policy "ratings_update_all"
  on public.ratings for update
  using (true);

create policy "ratings_delete_all"
  on public.ratings for delete
  using (true);
