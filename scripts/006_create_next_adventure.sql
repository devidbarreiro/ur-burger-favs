-- Create table for next adventure (wishlist)
CREATE TABLE IF NOT EXISTS next_adventure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_name TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT NOT NULL
);

-- Insert initial empty row
INSERT INTO next_adventure (place_name, updated_by) 
VALUES ('', 'system')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE next_adventure ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON next_adventure
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public insert access" ON next_adventure
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON next_adventure
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Allow public delete access" ON next_adventure
  FOR DELETE TO public
  USING (true);
