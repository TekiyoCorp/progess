-- Migration pour ajouter les nouvelles fonctionnalités
-- Exécute ce script dans Supabase SQL Editor

-- 1. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all operations on folders" ON folders;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on problems" ON problems;
DROP POLICY IF EXISTS "Allow all operations on progress" ON progress;
DROP POLICY IF EXISTS "Allow all operations on monthly_archives" ON monthly_archives;

-- 2. Recréer les politiques
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

-- 3. Ajouter les nouvelles colonnes à la table tasks (si elles n'existent pas)
DO $$
BEGIN
  -- Ajouter archived
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'archived'
  ) THEN
    ALTER TABLE tasks ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;

  -- Ajouter blocked
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'blocked'
  ) THEN
    ALTER TABLE tasks ADD COLUMN blocked BOOLEAN DEFAULT FALSE;
  END IF;

  -- Ajouter block_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'block_reason'
  ) THEN
    ALTER TABLE tasks ADD COLUMN block_reason TEXT;
  END IF;
END $$;

-- 4. Créer la table templates si elle n'existe pas
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- 5. Index pour les templates
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count DESC);

-- 6. RLS pour templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on templates" ON templates;
CREATE POLICY "Allow all operations on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Trigger pour templates
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '📋 Nouvelles colonnes ajoutées : archived, blocked, block_reason';
  RAISE NOTICE '📁 Table templates créée';
  RAISE NOTICE '🔒 Politiques RLS mises à jour';
END $$;

