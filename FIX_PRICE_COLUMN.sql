-- ======================================
-- FIX COLONNE PRICE DANS TABLE FOLDERS
-- ======================================
-- Ce script corrige le bug de prévision CA à 0€

-- 1. Vérifier si la colonne existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'folders' AND column_name = 'price'
    ) THEN
        -- 2. Ajouter la colonne price si elle n'existe pas
        ALTER TABLE folders ADD COLUMN price INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Colonne price ajoutée à la table folders';
    ELSE
        RAISE NOTICE '⚠️  Colonne price existe déjà';
    END IF;
END $$;

-- 3. S'assurer que les valeurs NULL sont remplacées par 0
UPDATE folders SET price = 0 WHERE price IS NULL;

-- 4. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_folders_price ON folders(price);

-- 5. Vérifier que tout fonctionne
SELECT 
    COUNT(*) as total_folders,
    SUM(price) as total_ca,
    AVG(price) as avg_price,
    MAX(price) as max_price
FROM folders;

-- 6. Afficher tous les dossiers avec leur prix
SELECT id, name, price, created_at 
FROM folders 
ORDER BY created_at DESC;

-- ✅ Script terminé
-- Si tu vois des résultats ci-dessus, la colonne existe et fonctionne !

