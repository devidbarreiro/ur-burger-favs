-- Insert initial data: 2 visits with ratings from both users

-- Insert restaurants
INSERT INTO restaurants (id, name, address, latitude, longitude, place_id, created_by, created_at)
VALUES 
  ('be81f5a9-f54f-45d6-8d37-65394acdeae7'::uuid, 'VICIO Almagro', 'C. de Almagro, 28, Chamberí, 28010 Madrid, España', 40.4312, -3.6936, 'ChIJd8BlQ2IvQg0RmXXRnXXRnXY', 'Lolo', '2025-10-08 19:47:27.266263+00'::timestamptz),
  ('c92e6b1a-8f3e-4d5c-9a2b-1e4f5a6b7c8d'::uuid, 'JUNK', 'C. de Ponzano, 11, Chamberí, 28010 Madrid, España', 40.4378, -3.7012, 'ChIJXxXxXxXxXxXxXxXxXxXxXxX', 'David', '2025-10-26 14:30:00+00'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Insert burgers
INSERT INTO burgers (id, restaurant_id, name, created_by, created_at)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid, 'be81f5a9-f54f-45d6-8d37-65394acdeae7'::uuid, 'Cheeseburger Trufada', 'Lolo', '2025-10-08 19:47:27.266263+00'::timestamptz),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e'::uuid, 'be81f5a9-f54f-45d6-8d37-65394acdeae7'::uuid, 'Bacon Cheeseburger', 'David', '2025-10-08 19:47:27.266263+00'::timestamptz),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f'::uuid, 'c92e6b1a-8f3e-4d5c-9a2b-1e4f5a6b7c8d'::uuid, 'La Campeona', 'Lolo', '2025-10-26 14:30:00+00'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Insert visits
INSERT INTO visits (id, restaurant_id, visit_date, image_url, created_by, created_at)
VALUES 
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a'::uuid, 'be81f5a9-f54f-45d6-8d37-65394acdeae7'::uuid, '2025-10-08 19:47:27.266263+00'::timestamptz, 'https://ynrxqvfrkqxjpqpxmwvx.supabase.co/storage/v1/object/public/burger-images/1728414447266-vicio.jpg', 'Lolo', '2025-10-08 19:47:27.266263+00'::timestamptz),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b'::uuid, 'c92e6b1a-8f3e-4d5c-9a2b-1e4f5a6b7c8d'::uuid, '2025-10-26 14:30:00+00'::timestamptz, 'https://ynrxqvfrkqxjpqpxmwvx.supabase.co/storage/v1/object/public/burger-images/1729951800000-junk.jpg', 'David', '2025-10-26 14:30:00+00'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Insert visit ratings
INSERT INTO visit_ratings (visit_id, burger_id, user_name, meat_rating, cheese_rating, juiciness_rating, bread_rating, sauce_rating, fries_rating, price, comment, created_at)
VALUES 
  -- VICIO visit - Lolo's rating
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a'::uuid, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid, 'Lolo', 2, 3, 4, 2, 3, NULL, 12.50, NULL, '2025-10-08 19:47:27.266263+00'::timestamptz),
  -- VICIO visit - David's rating
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a'::uuid, 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e'::uuid, 'David', 3, 4, 2, 2, 1, NULL, 13.00, NULL, '2025-10-08 19:47:27.266263+00'::timestamptz),
  -- JUNK visit - Lolo's rating
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b'::uuid, 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f'::uuid, 'Lolo', 4, 4, 4, 4, 5, NULL, 14.00, NULL, '2025-10-26 14:30:00+00'::timestamptz),
  -- JUNK visit - David's rating
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b'::uuid, 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f'::uuid, 'David', 4, 3, 3, 4, 4, NULL, 14.00, NULL, '2025-10-26 14:30:00+00'::timestamptz)
ON CONFLICT DO NOTHING;

-- Insert next adventure
INSERT INTO next_adventure (place_name, address, latitude, longitude, place_id, updated_by, updated_at)
VALUES ('JUNK', 'C. de Ponzano, 11, Chamberí, 28010 Madrid, España', 40.4378, -3.7012, 'ChIJXxXxXxXxXxXxXxXxXxXxXxX', 'David', '2025-10-26 12:00:00+00'::timestamptz)
ON CONFLICT DO NOTHING;
