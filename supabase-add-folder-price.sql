-- Ajouter la colonne 'price' à la table 'folders'
ALTER TABLE folders ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_folders_price ON folders(price);
