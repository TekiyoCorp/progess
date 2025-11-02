# 📁 Guide des Dossiers - Drag & Drop pour Tâches

## ✨ Fonctionnalités implémentées

### 🎯 Drag & Drop intelligent
- **Glisser une tâche sur une autre** → Crée automatiquement un dossier
- **Glisser une tâche dans un dossier** → Ajoute la tâche au dossier
- **Glisser une tâche hors d'un dossier** → Retire la tâche du dossier

### 📂 Gestion des dossiers
- **Renommer** : Cliquer sur le nom du dossier
- **Supprimer** : Bouton poubelle (les tâches sont conservées)
- **Expand/Collapse** : Cliquer sur la flèche

### 🤖 Résumé IA automatique
- Généré automatiquement à la création du dossier
- Analyse toutes les tâches du dossier
- Format : 15-20 mots max, ultra concis
- Affichage avec gradient rose-bleu et icône étoile

---

## 🗄️ Architecture créée

### 1. **Base de données** (`supabase-schema.sql`)
```sql
-- Table folders
CREATE TABLE folders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID
);

-- Mise à jour table tasks
ALTER TABLE tasks ADD COLUMN folder_id UUID REFERENCES folders(id);
ALTER TABLE tasks ADD COLUMN order_index INTEGER;
ALTER TABLE tasks ADD COLUMN event_id TEXT;
ALTER TABLE tasks ADD COLUMN event_start TIMESTAMP;
```

### 2. **Types TypeScript** (`types/index.ts`)
```typescript
interface Folder {
  id: string;
  name: string;
  summary?: string; // Résumé IA
  order_index: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
  tasks?: Task[];
}

interface Task {
  ...
  folder_id?: string; // Dossier parent
  order_index?: number; // Ordre d'affichage
  event_id?: string; // Google Calendar
  event_start?: string;
}
```

### 3. **Hook `useFolders`** (`hooks/useFolders.ts`)
- `createFolder(input)` : Créer un dossier
- `updateFolder(input)` : Mettre à jour (nom, résumé, ordre)
- `deleteFolder(id)` : Supprimer un dossier
- `generateFolderSummary(id, tasks)` : Générer résumé IA

### 4. **Composants créés**
```
components/folders/
├── FolderItem.tsx         → Dossier complet avec drag & drop
├── FolderHeader.tsx       → Header (nom, actions, expand/collapse)
└── FolderSummary.tsx      → Résumé IA avec gradient

components/tasks/
├── DraggableTaskItem.tsx  → Task draggable
└── TasksWithFolders.tsx   → Intégration complète drag & drop
```

### 5. **API Route** (`/api/folder-summary`)
- **POST** avec `{ tasks: Task[] }`
- Génère un résumé ultra-concis avec GPT-4o-mini
- Format : 15-20 mots maximum
- Exemple : "Closing Naturopathe - Appel qualification, préparation devis et livraison maquette"

### 6. **Bibliothèque** : `@dnd-kit`
- `@dnd-kit/core` : Drag & drop core
- `@dnd-kit/sortable` : Tri des éléments
- `@dnd-kit/utilities` : Utilitaires CSS

---

## 🚀 Installation

### 1. Mettre à jour la base de données Supabase

Va dans ton **Supabase Dashboard** → **SQL Editor** → **New Query**

Copie-colle **tout le contenu** de `supabase-schema.sql` et clique sur **RUN**.

⚠️ **Note** : Le script contient `CREATE TABLE IF NOT EXISTS`, donc il ne va pas écraser tes tables existantes, seulement les mettre à jour.

### 2. Les dépendances sont déjà installées ✅
```bash
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```

### 3. Redémarrer le serveur
```bash
# Le serveur tourne déjà, mais si besoin :
npm run dev
```

---

## 💡 Comment utiliser

### Créer un dossier
1. **Maintenir (long press)** une tâche
2. **Glisser** sur une autre tâche
3. **Relâcher** → Dossier créé automatiquement
4. Le dossier prend le nom de la première tâche (tronqué à 20 caractères)
5. Le résumé IA est généré automatiquement

### Ajouter une tâche à un dossier
1. **Maintenir** une tâche
2. **Glisser** sur un dossier (zone devient rose)
3. **Relâcher** → Tâche ajoutée au dossier
4. Le résumé IA est mis à jour

### Retirer une tâche d'un dossier
1. **Maintenir** une tâche dans un dossier
2. **Glisser** hors du dossier (zone vide)
3. **Relâcher** → Tâche retirée du dossier

### Renommer un dossier
1. **Cliquer** sur le nom du dossier
2. **Modifier** le texte
3. **Entrée** pour valider ou **Échap** pour annuler

### Supprimer un dossier
1. **Hover** sur le dossier
2. **Cliquer** sur l'icône poubelle
3. **Confirmer** → Dossier supprimé, tâches conservées

### Expand/Collapse un dossier
1. **Cliquer** sur la flèche (▼ ou ▶)

---

## 🎨 Design

### Visuel d'un dossier
```
┌───────────────────────────────────────────────┐
│ ▼ 📁 Closing Naturopathe (3)          🗑️    │ ← Header
│                                                │
│   ⭐ Closing Naturopathe - Appel qualif...    │ ← Résumé IA
│                                                │
│   ⚪ Préparer call Naturopathe (1%)           │
│   ⚪ Call Naturopathe projet 15k (5%)         │
│   ⚪ Envoyer devis si validé (4%)             │
│                                                │
└───────────────────────────────────────────────┘
```

### Style minimaliste
- ✅ Bordure `border-white/10`
- ✅ Background transparent
- ✅ Padding `p-2`
- ✅ Résumé avec gradient rose-bleu
- ✅ Zone active (hover) → bordure rose `border-pink-400/50`
- ✅ Fonts 12px cohérentes
- ✅ Icônes 12px×12px

---

## 🔧 Dépannage

### "Table folders already exists"
➡️ Normal ! Le script utilise `CREATE TABLE IF NOT EXISTS`

### "Cannot read property 'folder_id'"
➡️ Vérifie que le script SQL a bien été exécuté dans Supabase

### Les tâches ne se déplacent pas
➡️ Vérifie que tu maintiens la tâche **au moins 8px** avant que le drag ne commence (activation constraint)

### Le résumé IA ne s'affiche pas
➡️ Vérifie que `OPENAI_API_KEY` est bien dans ton `.env.local`

### LocalStorage fallback
Si Supabase n'est pas disponible, l'app utilise automatiquement `localStorage` pour stocker les dossiers.

---

## 📊 Exemple de workflow

### Scénario : Projet "Naturopathe"

1. **Tu as 3 tâches séparées** :
   ```
   ⚪ Préparer call Naturopathe
   ⚪ Call Naturopathe projet 15k
   ⚪ Envoyer devis si validé
   ```

2. **Tu glisses la 1ère tâche sur la 2ème** :
   ```
   📁 Préparer call Naturo... (3)
      ⭐ Closing Naturopathe - Appel qualification, préparation devis
      ⚪ Préparer call Naturopathe (1%)
      ⚪ Call Naturopathe projet 15k (5%)
      ⚪ Envoyer devis si validé (4%)
   ```

3. **Tu renommes le dossier** :
   ```
   📁 Closing Naturopathe (3)
      ⭐ Closing Naturopathe - Appel qualification, préparation devis
      ...
   ```

4. **Le call est fait, tu coches** :
   ```
   📁 Closing Naturopathe (3)
      ⭐ Closing Naturopathe - Appel qualification, préparation devis
      ☑️ Préparer call Naturopathe (1%)
      ☑️ Call Naturopathe projet 15k (5%)
      ⚪ Envoyer devis si validé (4%)
   ```

5. **Le projet est terminé, tu supprimes le dossier** :
   ```
   ☑️ Préparer call Naturopathe (1%)
   ☑️ Call Naturopathe projet 15k (5%)
   ☑️ Envoyer devis si validé (4%)
   ```

---

## 🎯 Optimisations futures (optionnel)

1. **Drag & drop dans l'ordre** : Réorganiser les tâches dans un dossier
2. **Dossiers dans des dossiers** : Sous-dossiers (hiérarchie)
3. **Templates de dossiers** : Créer des modèles réutilisables
4. **Partage de dossiers** : Collaborer avec l'équipe
5. **Statistiques par dossier** : Voir le % total du dossier

---

✨ **C'est prêt !** Tu peux maintenant **organiser tes tâches par dossiers** avec un drag & drop ultra fluide ! 🚀

**Teste-le maintenant** :
1. Va dans ton dashboard : [http://localhost:3000](http://localhost:3000)
2. Maintiens une tâche et glisse-la sur une autre
3. Un dossier est créé automatiquement avec un résumé IA ! 🎉


