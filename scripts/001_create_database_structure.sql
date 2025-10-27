-- Complete database structure for burger rating app
-- Creates all necessary tables: restaurants, burgers, visits, visit_ratings, next_adventure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  place_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Burgers table (menu items for each restaurant)
CREATE TABLE IF NOT EXISTS burgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

-- Visits table (each visit to a restaurant)
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visit ratings table (individual burger ratings in each visit)
CREATE TABLE IF NOT EXISTS visit_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  burger_id UUID REFERENCES burgers(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  meat_rating INTEGER CHECK (meat_rating >= 1 AND meat_rating <= 5),
  cheese_rating INTEGER CHECK (cheese_rating >= 1 AND cheese_rating <= 5),
  juiciness_rating INTEGER CHECK (juiciness_rating >= 1 AND juiciness_rating <= 5),
  bread_rating INTEGER CHECK (bread_rating >= 1 AND bread_rating <= 5),
  sauce_rating INTEGER CHECK (sauce_rating >= 1 AND sauce_rating <= 5),
  fries_rating INTEGER CHECK (fries_rating >= 1 AND fries_rating <= 5),
  price NUMERIC,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Next adventure table
CREATE TABLE IF NOT EXISTS next_adventure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  place_id TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_burgers_restaurant ON burgers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_visits_restaurant ON visits(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_visit ON visit_ratings(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_burger ON visit_ratings(burger_id);
CREATE INDEX IF NOT EXISTS idx_visit_ratings_user ON visit_ratings(user_name);

-- RLS Policies (permissive for now since it's a two-user app)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE burgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_adventure ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON restaurants FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON burgers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON visits FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON visit_ratings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON next_adventure FOR ALL USING (true);
