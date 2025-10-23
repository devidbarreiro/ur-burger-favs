-- Drop existing policies if they exist
drop policy if exists "burger_places_select_all" on public.burger_places;
drop policy if exists "burger_places_insert_all" on public.burger_places;
drop policy if exists "burger_places_update_all" on public.burger_places;
drop policy if exists "burger_places_delete_all" on public.burger_places;

drop policy if exists "ratings_select_all" on public.ratings;
drop policy if exists "ratings_insert_all" on public.ratings;
drop policy if exists "ratings_update_all" on public.ratings;
drop policy if exists "ratings_delete_all" on public.ratings;

-- Create policies that work for anonymous users
-- Policies for burger_places
create policy "burger_places_select_all"
  on public.burger_places for select
  to anon, authenticated
  using (true);

create policy "burger_places_insert_all"
  on public.burger_places for insert
  to anon, authenticated
  with check (true);

create policy "burger_places_update_all"
  on public.burger_places for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "burger_places_delete_all"
  on public.burger_places for delete
  to anon, authenticated
  using (true);

-- Policies for ratings
create policy "ratings_select_all"
  on public.ratings for select
  to anon, authenticated
  using (true);

create policy "ratings_insert_all"
  on public.ratings for insert
  to anon, authenticated
  with check (true);

create policy "ratings_update_all"
  on public.ratings for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "ratings_delete_all"
  on public.ratings for delete
  to anon, authenticated
  using (true);
