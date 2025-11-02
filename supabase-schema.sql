-- Tekiyo Progress Dashboard - Database Schema
-- Run this script in your Supabase SQL Editor

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  percentage NUMERIC(4,1) DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 10),
  type TEXT CHECK (type IN ('call', 'design', 'video', 'email', 'other')),
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  event_id TEXT,
  event_start TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  solution TEXT,
  solved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Create progress table (monthly tracking)
CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_percentage NUMERIC(6,1) DEFAULT 0,
  amount_generated NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  UNIQUE(month, year, user_id)
);

-- Create monthly_archives table
CREATE TABLE IF NOT EXISTS monthly_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  final_percentage NUMERIC(6,1) DEFAULT 0,
  amount NUMERIC(10,2) DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  UNIQUE(month, year, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_order ON folders(order_index);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_folder_id ON tasks(folder_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);

CREATE INDEX IF NOT EXISTS idx_problems_user_id ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_solved ON problems(solved);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_month_year ON progress(month, year);

CREATE INDEX IF NOT EXISTS idx_monthly_archives_user_id ON monthly_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_archives_year ON monthly_archives(year DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_problems_updated_at ON problems;
CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_updated_at ON progress;
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_archives ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for MVP, can be tightened later)
-- For now, allow all operations without authentication for easier MVP testing

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on folders" ON folders;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on problems" ON problems;
DROP POLICY IF EXISTS "Allow all operations on progress" ON progress;
DROP POLICY IF EXISTS "Allow all operations on monthly_archives" ON monthly_archives;

-- Create policies
CREATE POLICY "Allow all operations on folders" ON folders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on problems" ON problems
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on progress" ON progress
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on monthly_archives" ON monthly_archives
  FOR ALL USING (true) WITH CHECK (true);

-- Insert initial progress record for current month
INSERT INTO progress (month, year, total_percentage, amount_generated)
VALUES (
  EXTRACT(MONTH FROM NOW())::INTEGER,
  EXTRACT(YEAR FROM NOW())::INTEGER,
  0,
  0
) ON CONFLICT (month, year, user_id) DO NOTHING;

