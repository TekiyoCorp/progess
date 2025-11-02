-- Migration pour ajouter la colonne attachments aux tâches
-- Run this script in your Supabase SQL Editor

-- Ajouter la colonne attachments (JSONB pour stocker un tableau d'attachments)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Index pour les recherches rapides sur les attachments
CREATE INDEX IF NOT EXISTS idx_tasks_attachments ON tasks USING GIN (attachments);

-- Corriger la policy RLS pour permettre toutes les opérations (y compris UPDATE)
-- Supprimer la policy existante si elle existe
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;

-- Recréer la policy avec FOR ALL pour permettre toutes les opérations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Vérification : afficher la structure de la table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'attachments';

