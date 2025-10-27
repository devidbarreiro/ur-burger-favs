-- DANGER: This script deletes ALL data from the database
-- Use only for testing purposes

-- Delete all data (cascades will handle related records)
DELETE FROM visit_ratings;
DELETE FROM visits;
DELETE FROM burgers;
DELETE FROM restaurants;
DELETE FROM next_adventure;

-- Reset sequences if needed
-- (UUID generation doesn't need sequence reset)

SELECT 'All data deleted successfully' AS result;
