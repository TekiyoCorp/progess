-- ============================================
-- 🔥 ACTIVATION SUPABASE REALTIME
-- ============================================
-- Ce script active Realtime pour les tables tasks, problems et folders
-- Exécute-le dans Supabase SQL Editor

-- Vérifier que la publication existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- La publication devrait exister par défaut, mais on la crée si nécessaire
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Ajouter les tables à la publication Realtime
-- (Cette commande est idempotente : si la table est déjà dans la publication, ça ne fait rien)
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE problems;
ALTER PUBLICATION supabase_realtime ADD TABLE folders;
ALTER PUBLICATION supabase_realtime ADD TABLE entities;

-- Configurer REPLICA IDENTITY pour que Realtime puisse capturer les changements
-- Cela permet à PostgreSQL de suivre les changements de lignes même pour UPDATE/DELETE
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE problems REPLICA IDENTITY FULL;
ALTER TABLE folders REPLICA IDENTITY FULL;
ALTER TABLE entities REPLICA IDENTITY FULL;

-- Vérifier que tout est bien configuré
SELECT 
  tablename,
  pubname as publication
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('tasks', 'problems', 'folders', 'entities')
ORDER BY tablename;

-- ============================================
-- ✅ REALTIME ACTIVÉ !
-- ============================================
-- Redémarre ton serveur Next.js et teste avec 2 onglets ouverts

