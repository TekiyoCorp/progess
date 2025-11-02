-- ⚠️ SCRIPT DE CORRECTION POUR LA TABLE FOLDERS
-- Copie-colle ce script ENTIER dans Supabase SQL Editor et clique sur RUN

-- Supprimer la table folders si elle existe (pour repartir de zéro)
DROP TABLE IF EXISTS folders CASCADE;

-- Recréer la table folders avec TOUTES les bonnes configs
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Index
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_order ON folders(order_index);

-- Trigger updated_at
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Désactiver RLS pour MVP (simplifie les tests)
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- Mettre à jour la table tasks (ajouter les colonnes si elles n'existent pas)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS event_id TEXT,
ADD COLUMN IF NOT EXISTS event_start TIMESTAMP WITH TIME ZONE;

-- Index pour tasks
CREATE INDEX IF NOT EXISTS idx_tasks_folder_id ON tasks(folder_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);

-- Vérification : afficher la structure de la table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'folders'
ORDER BY ordinal_position;


