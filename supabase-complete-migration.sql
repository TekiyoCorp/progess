-- ============================================
-- MIGRATION COMPLÈTE - Progression Tekiyo
-- ============================================
-- Ce script crée toutes les tables et configurations nécessaires
-- Exécutez-le dans Supabase SQL Editor

-- ============================================
-- 1. NETTOYER LES ANCIENNES POLICIES
-- ============================================

-- Tasks policies
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for all users" ON tasks;
DROP POLICY IF EXISTS "Enable update for all users" ON tasks;
DROP POLICY IF EXISTS "Enable delete for all users" ON tasks;

-- Problems policies
DROP POLICY IF EXISTS "Allow all operations on problems" ON problems;
DROP POLICY IF EXISTS "Enable read access for all users" ON problems;
DROP POLICY IF EXISTS "Enable insert for all users" ON problems;
DROP POLICY IF EXISTS "Enable update for all users" ON problems;
DROP POLICY IF EXISTS "Enable delete for all users" ON problems;

-- Folders policies
DROP POLICY IF EXISTS "Allow all operations on folders" ON folders;
DROP POLICY IF EXISTS "Enable read access for all users" ON folders;
DROP POLICY IF EXISTS "Enable insert for all users" ON folders;
DROP POLICY IF EXISTS "Enable update for all users" ON folders;
DROP POLICY IF EXISTS "Enable delete for all users" ON folders;

-- Entities policies
DROP POLICY IF EXISTS "Allow all operations on entities" ON entities;
DROP POLICY IF EXISTS "Enable read access for all users" ON entities;
DROP POLICY IF EXISTS "Enable insert for all users" ON entities;
DROP POLICY IF EXISTS "Enable update for all users" ON entities;
DROP POLICY IF EXISTS "Enable delete for all users" ON entities;

-- Templates policies
DROP POLICY IF EXISTS "Allow all operations on templates" ON templates;

-- ============================================
-- 2. CRÉER LES TABLES
-- ============================================

-- Table TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  percentage INTEGER DEFAULT 1,
  type TEXT DEFAULT 'other',
  folder_id UUID,
  order_index INTEGER,
  event_id TEXT,
  event_start TIMESTAMP WITH TIME ZONE,
  archived BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table PROBLEMS
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  solved BOOLEAN DEFAULT false,
  solution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table FOLDERS
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER,
  color TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ENTITIES
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project', 'developer', 'colleague', 'client')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CRÉER LES FOREIGN KEYS
-- ============================================

-- Ajouter la FK de tasks vers folders (si elle n'existe pas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_folder_id_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_folder_id_fkey 
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter la FK de tasks vers entities (si elle n'existe pas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_entity_id_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_entity_id_fkey 
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 4. CRÉER LES INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_folder_id ON tasks(folder_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_entity_id ON tasks(entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_problems_solved ON problems(solved);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);

-- ============================================
-- 5. ACTIVER RLS
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CRÉER LES POLICIES RLS
-- ============================================

-- Policies pour TASKS
CREATE POLICY "Allow all operations on tasks"
  ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies pour PROBLEMS
CREATE POLICY "Allow all operations on problems"
  ON problems
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies pour FOLDERS
CREATE POLICY "Allow all operations on folders"
  ON folders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies pour ENTITIES
CREATE POLICY "Allow all operations on entities"
  ON entities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7. CRÉER LES TRIGGERS updated_at
-- ============================================

-- Fonction générique pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour tasks
DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger pour problems
DROP TRIGGER IF EXISTS problems_updated_at ON problems;
CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger pour folders
DROP TRIGGER IF EXISTS folders_updated_at ON folders;
CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger pour entities
DROP TRIGGER IF EXISTS entities_updated_at ON entities;
CREATE TRIGGER entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ✅ MIGRATION TERMINÉE
-- ============================================
-- Toutes les tables et configurations sont prêtes !

