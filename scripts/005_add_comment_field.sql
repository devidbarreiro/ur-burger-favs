-- Add comment field to ratings table
alter table public.ratings
add column if not exists comment text;
