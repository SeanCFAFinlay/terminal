-- Create subscribers table for email capture
CREATE TABLE IF NOT EXISTS subscribers (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for email signup
-- Uses FOR ALL because PG17 INSERT with RETURNING requires SELECT visibility
CREATE POLICY "anon_insert" ON subscribers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
