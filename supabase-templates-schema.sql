-- Table pour les templates de tâches
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tasks JSONB NOT NULL, -- Array de { title: string, type: TaskType }
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS templates_usage_count_idx ON public.templates(usage_count DESC);

-- RLS Policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : l'utilisateur peut lire ses propres templates
CREATE POLICY "Users can read their own templates"
  ON public.templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique d'insertion : l'utilisateur peut créer ses propres templates
CREATE POLICY "Users can create their own templates"
  ON public.templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour : l'utilisateur peut mettre à jour ses propres templates
CREATE POLICY "Users can update their own templates"
  ON public.templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique de suppression : l'utilisateur peut supprimer ses propres templates
CREATE POLICY "Users can delete their own templates"
  ON public.templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- Ajouter les colonnes manquantes à la table tasks si elles n'existent pas déjà
DO $$
BEGIN
  -- Ajouter archived
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'archived'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;

  -- Ajouter blocked
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'blocked'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN blocked BOOLEAN DEFAULT FALSE;
  END IF;

  -- Ajouter block_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'block_reason'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN block_reason TEXT;
  END IF;
END $$;

