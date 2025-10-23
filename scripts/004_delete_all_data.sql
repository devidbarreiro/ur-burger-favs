-- Delete all data from the database
-- WARNING: This will permanently delete all burger places and ratings

-- Delete all ratings first (due to foreign key constraint)
DELETE FROM ratings;

-- Delete all burger places
DELETE FROM burger_places;

-- Optional: Reset the sequences if you want IDs to start from 1 again
-- (Not necessary for UUID primary keys, but included for completeness)
