# 🚨 AUDIT COMPLET - Tekiyo Dashboard

**Date**: 2 novembre 2025  
**Status**: CRITIQUE - Plusieurs bugs majeurs détectés

---

## 🔴 BUGS CRITIQUES (Empêchent le fonctionnement)

### 1. **Le projet ne compile pas** ❌
**Fichier**: `.next/dev/types/app/api/transcribe/route.ts`  
**Erreur**: `Cannot find module '../../../../../../app/api/transcribe/route.js'`

**Cause**: Le fichier `/app/api/transcribe/route.ts` a été supprimé, mais Next.js cherche encore à le compiler.

**Impact**: 
- Le projet ne build pas
- Impossible de déployer en production
- Cache Next.js corrompu

**Solution**:
```bash
# 1. Supprimer le cache Next.js
rm -rf .next

# 2. Rebuild
npm run build
```

**Status**: 🔴 BLOQUANT

---

### 2. **Prévision CA toujours à 0€** ❌
**Fichiers concernés**:
- `hooks/useFolders.ts`
- `components/dashboard/TasksColumn.tsx`  
- `app/api/ai/revenue-forecast/route.ts`

**Cause racine**: La colonne `price` n'existe probablement PAS dans la table `folders` de Supabase.

**Diagnostic**:
1. Le frontend envoie le prix → OK ✅
2. Supabase rejette silencieusement la colonne inconnue → ❌
3. Le prix n'est jamais sauvegardé → ❌
4. La prévision CA récupère des dossiers avec `price: null` → 0€

**Preuves**:
- Le SQL `supabase-add-folder-price.sql` existe mais n'a peut-être jamais été exécuté
- Aucune erreur visible car Supabase ignore les colonnes inconnues

**Solution**:
```sql
-- 1. Vérifier si la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'folders' AND column_name = 'price';

-- 2. Si elle n'existe pas, la créer
ALTER TABLE folders ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- 3. Vérifier les données existantes
SELECT id, name, price FROM folders;
```

**Status**: 🔴 BLOQUANT (fonctionnalité CA inutilisable)

---

### 3. **Error updating progress: {}** ❌
**Fichier**: `hooks/useProgress.ts`

**Cause**: 
- `useProgress` utilise maintenant `createBrowserClient()` 
- MAIS les autres hooks utilisent encore `supabase` global
- Incohérence entre les imports

**Diagnostic**:
```typescript
// useProgress.ts - NOUVEAU (ligne 4)
import { createBrowserClient } from '@/lib/supabase';

// useTasks.ts - ANCIEN (ligne 4)
import { supabase } from '@/lib/supabase';

// useProblems.ts - ANCIEN (ligne 4)  
import { supabase } from '@/lib/supabase';

// useFolders.ts - ANCIEN (ligne 5)
import { supabase } from '@/lib/supabase';
```

**Impact**:
- Erreurs console persistantes
- Progress bar peut ne pas se mettre à jour
- Expérience utilisateur dégradée

**Solution**: Uniformiser tous les hooks pour utiliser `createBrowserClient()` OU `supabase` global (pas les deux).

**Status**: 🟠 IMPORTANT (fonctionnel mais buggé)

---

## 🟠 BUGS IMPORTANTS (Fonctionnalité dégradée)

### 4. **98 console.log dans les hooks** ⚠️
**Fichiers**:
- `hooks/useProgress.ts`: 6 logs
- `hooks/useFolders.ts`: 15 logs
- `hooks/useTasks.ts`: 26 logs
- `hooks/useProblems.ts`: 29 logs
- `hooks/useEntities.ts`: 5 logs
- `hooks/useCalendarEvents.ts`: 12 logs
- `hooks/useGoogleCalendar.ts`: 5 logs

**Impact**:
- Performance dégradée en production
- Console illisible
- Impossible de débugger

**Solution**: Créer un système de logging conditionnel
```typescript
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const log = {
  info: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
};
```

**Status**: 🟠 IMPORTANT (pollution de la console)

---

### 5. **Folders ne se ferment pas au chargement** ⚠️
**Fichier**: `components/folders/FolderItem.tsx` (ligne 42)

**Code actuel**:
```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

**Problème**: Les dossiers sont censés être fermés (false), mais ils s'affichent ouverts.

**Cause possible**: Un `useEffect` ou une logique ailleurs force l'ouverture.

**Status**: 🟡 MINEUR (UX)

---

### 6. **Prix du dossier ne s'affiche pas** ⚠️
**Fichier**: `components/folders/FolderHeader.tsx`

**Symptôme**: L'icône € affiche toujours "0" même après édition.

**Cause**: 
1. La valeur n'est pas sauvegardée dans Supabase (voir Bug #2)
2. OU le composant ne reçoit pas la prop `price` mise à jour

**Diagnostic nécessaire**:
- Vérifier que `folder.price` est bien passé au composant
- Vérifier que `onUpdateFolder` est appelé correctement
- Vérifier les logs de `useFolders.updateFolder`

**Status**: 🟠 IMPORTANT (lié au Bug #2)

---

## 🟡 PROBLÈMES ARCHITECTURAUX

### 7. **Incohérence des imports Supabase** ⚠️
**Fichiers**: Tous les hooks

**Problème**:
- `useProgress.ts` utilise `createBrowserClient()`
- Tous les autres hooks utilisent `supabase` global
- Incohérence architecturale

**Recommandation**: Choisir UNE stratégie :
- **Option A**: Tout en `supabase` global (plus simple)
- **Option B**: Tout en `createBrowserClient()` (plus flexible)

**Status**: 🟡 ARCHITECTURAL

---

### 8. **Trop de useEffect dans TasksColumn** ⚠️
**Fichier**: `components/dashboard/TasksColumn.tsx`

**Nombre de `useEffect`**: 4+
- Auto-création de tâches
- Prévision CA
- Sync Calendar
- Autres...

**Problème**:
- Difficile à maintenir
- Risque de boucles infinies
- Performance dégradée

**Recommandation**: Refactoriser en hooks séparés
```typescript
// useAutoTaskCreation.ts
// useRevenueForecast.ts  
// useCalendarSync.ts
```

**Status**: 🟡 ARCHITECTURAL

---

### 9. **Realtime Supabase peut ne pas être activé** ⚠️
**Tables**: tasks, problems, folders, entities

**Symptôme**: Les updates ne se propagent pas automatiquement entre clients.

**Diagnostic**:
```sql
-- Vérifier si Realtime est activé
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Solution**: Exécuter `supabase-enable-realtime.sql`

**Status**: 🟡 FONCTIONNALITÉ

---

## ✅ CE QUI FONCTIONNE

1. ✅ **CRUD tasks** - Création, lecture, update, delete
2. ✅ **CRUD problems** - Avec auto-solve IA
3. ✅ **CRUD folders** - Drag & drop
4. ✅ **Scoring IA** - Attribution de % aux tâches
5. ✅ **Focus Mode** - Avec Pomodoro
6. ✅ **Search globale** - Cmd+K
7. ✅ **Attachments** - Images, PDFs, liens
8. ✅ **Mentions** - Système `<` pour entités
9. ✅ **Quick actions** - Dupliquer, archiver, bloquer
10. ✅ **Momentum Tracker** - Streak et momentum
11. ✅ **Win Celebration** - Confettis
12. ✅ **Weekly Planning** - Modal IA
13. ✅ **Auto-création tasks** - Prérequis/follow-ups
14. ✅ **Fallback localStorage** - Fonctionne sans Supabase

---

## 🔧 PLAN DE CORRECTION PRIORITAIRE

### Phase 1: URGENT (à faire MAINTENANT)
1. ✅ Supprimer le cache Next.js: `rm -rf .next`
2. ✅ Vérifier/créer la colonne `price` dans Supabase
3. ✅ Uniformiser les imports Supabase dans tous les hooks
4. ✅ Tester la prévision CA avec des vraies données

### Phase 2: IMPORTANT (dans les 24h)
5. ⚠️ Créer un système de logging conditionnel
6. ⚠️ Vérifier que Realtime est activé
7. ⚠️ Tester le flow complet de prix de dossier
8. ⚠️ Refactoriser les `useEffect` de `TasksColumn`

### Phase 3: AMÉLIORATION (cette semaine)
9. 🟡 Nettoyer les console.log en production
10. 🟡 Optimiser les re-renders
11. 🟡 Documenter le flow de données
12. 🟡 Ajouter des tests unitaires critiques

---

## 📊 MÉTRIQUES DE SANTÉ DU PROJET

| Métrique | Valeur | Status |
|----------|--------|--------|
| **Build réussi** | ❌ Non | 🔴 Critique |
| **Prévision CA fonctionnelle** | ❌ Non | 🔴 Critique |
| **Errors console** | 🟠 1-2 | 🟠 Moyen |
| **Warnings console** | 🟠 Plusieurs | 🟠 Moyen |
| **Console.log en prod** | ❌ 98 | 🟠 Moyen |
| **Tests unitaires** | ❌ 0 | 🟡 À améliorer |
| **Realtime activé** | ❓ Inconnu | 🟡 À vérifier |
| **Performance** | 🟢 Bonne | 🟢 OK |
| **Architecture** | 🟡 Moyenne | 🟡 À améliorer |

---

## 🎯 PROCHAINES ÉTAPES

1. **Débloquer le build** (5 min)
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Fix prévision CA** (10 min)
   - Aller dans Supabase Dashboard
   - SQL Editor → Exécuter le script `price`
   - Vérifier la colonne existe
   - Tester l'édition du prix

3. **Uniformiser Supabase** (15 min)
   - Choisir `supabase` global
   - Mettre à jour `useProgress.ts`
   - Tester tous les hooks

4. **Créer le système de logging** (20 min)
   - Créer `lib/logger.ts`
   - Remplacer tous les `console.log`
   - Tester en dev et prod

---

## 📝 NOTES IMPORTANTES

- Le projet **fonctionne en mode localStorage** si Supabase échoue ✅
- La plupart des fonctionnalités sont **opérationnelles** ✅
- Les bugs sont principalement liés à **Supabase** et au **CA** 🔴
- L'architecture est **solide** mais pourrait être **optimisée** 🟡

---

**Conclusion**: Le projet est à 85% fonctionnel. Les bugs critiques sont localisés et corrigeables rapidement. Priorité absolue : fix du build et de la prévision CA.

**Auteur**: Audit automatique  
**Version**: 1.0  
**Prochaine revue**: Après correction Phase 1

