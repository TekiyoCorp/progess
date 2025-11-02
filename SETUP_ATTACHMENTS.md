# 📎 Configuration des Attachments pour les Tâches

## ✅ Fonctionnalités implémentées

- **Upload d'images** : JPG, PNG, GIF, WebP
- **Upload de PDF** : Documents PDF
- **Ajout de liens** : URLs externes
- **Visualiseur modal** : Cliquer sur un attachment pour le voir en grand
- **Affichage compact** : 32x32px avec border-radius de 8px

## 🔧 Configuration Supabase

### 1. Créer le Storage Bucket

Dans Supabase Dashboard → Storage → New Bucket :

- **Name** : `task-attachments`
- **Public** : ✅ Oui (pour accès direct aux fichiers)
- **File size limit** : 10 MB (ou plus selon tes besoins)
- **Allowed MIME types** : `image/*,application/pdf`

### 2. Configurer les Policies RLS

Dans Storage → Policies → New Policy pour `task-attachments` :

```sql
-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Policy: Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-attachments');

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments');
```

### 3. Exécuter la Migration SQL

Copie-colle `supabase-attachments-migration.sql` dans Supabase SQL Editor et clique sur RUN.

## 📁 Structure des Fichiers

```
components/tasks/
  ├── TaskItem.tsx              (Affiche les attachments)
  ├── TaskAttachmentUploader.tsx (Boutons upload)
  └── AttachmentViewer.tsx      (Modal visualiseur)

app/api/tasks/
  ├── upload-attachment/route.ts (Upload fichiers)
  └── add-attachment-link/route.ts (Ajouter lien)
```

## 🎨 Design

- **Thumbnails** : 32x32px, border-radius 8px
- **Images** : Affichage direct avec preview
- **PDF** : Icône FileText rouge
- **Liens** : Icône LinkIcon bleue
- **Hover** : Border devient plus visible

## 🔄 Flux d'utilisation

1. Hover sur une tâche → Boutons upload apparaissent
2. Cliquer sur Upload → Sélectionner fichier
3. Cliquer sur Link → Entrer URL
4. L'attachment apparaît en thumbnail 32x32
5. Cliquer sur thumbnail → Ouvre le visualiseur modal
6. Escape ou clic X → Ferme le visualiseur

## 🐛 Dépannage

Si les uploads ne fonctionnent pas :
1. Vérifier que le bucket `task-attachments` existe
2. Vérifier les policies RLS du bucket
3. Vérifier que la colonne `attachments` existe dans la table `tasks`
4. Vérifier les logs dans la console du navigateur

