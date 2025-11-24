-- Create quotes table for storing user quote requests
-- Run this in your Supabase SQL Editor

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,

  -- Model info
  model_file_name TEXT NOT NULL,
  model_file_url TEXT,
  material TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  timeline TEXT NOT NULL,
  finishing TEXT NOT NULL,
  scale INTEGER DEFAULT 100,

  -- Model stats
  vertices INTEGER,
  triangles INTEGER,
  dimensions JSONB, -- {x: "10mm", y: "20mm", z: "30mm"}

  -- Pricing
  base_cost DECIMAL(10,2),
  material_cost DECIMAL(10,2),
  finishing_cost DECIMAL(10,2),
  quantity_discount DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'cancelled')),
  admin_notes TEXT,

  -- Additional
  message TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_id ON quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Users can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;

-- Policy: Users can view their own quotes
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own quotes
CREATE POLICY "Users can insert own quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own quotes (for cancellations, etc.)
CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: Add a policy for admins to view all quotes
-- Uncomment if you want to set up an admin role later
-- CREATE POLICY "Admins can view all quotes"
--   ON quotes FOR SELECT
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Optional: Add a policy for admins to update any quote
-- CREATE POLICY "Admins can update all quotes"
--   ON quotes FOR UPDATE
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Create a function to automatically clean up old pending quotes (optional)
CREATE OR REPLACE FUNCTION cleanup_old_pending_quotes()
RETURNS void AS $$
BEGIN
  -- Delete pending quotes older than 30 days
  DELETE FROM quotes
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can set up a cron job in Supabase to run this function periodically

COMMENT ON TABLE quotes IS 'Stores quote requests from verified users';
COMMENT ON COLUMN quotes.user_id IS 'Links to auth.users - the user who submitted the quote';
COMMENT ON COLUMN quotes.quote_id IS 'Human-readable quote ID shown to users (e.g., HF-ABC123)';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending, reviewed, accepted, rejected, cancelled';
