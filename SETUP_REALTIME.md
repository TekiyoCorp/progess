# 🔥 Activation Supabase Realtime

## Étapes pour activer Realtime sur tes tables

### 1. **Accéder au Dashboard Supabase**
- Va sur [https://app.supabase.com](https://app.supabase.com)
- Sélectionne ton projet (`cvdxhartnemojqomucol`)

### 2. **Activer Realtime via SQL (méthode la plus fiable)**

⚠️ **La page "Replication" que tu vois est pour la réplication vers des destinations externes** (BigQuery, Iceberg), pas pour Realtime.  
✅ **Active Realtime via SQL** :

1. Dans le menu latéral, clique sur **SQL Editor**
2. Clique sur **New Query**
3. **Copie-colle le contenu du fichier `supabase-enable-realtime.sql`**
4. Clique sur **Run** (en bas à droite)
5. Tu devrais voir un tableau avec tes tables listées (tasks, problems, folders, entities)

**Alternative (si tu veux vérifier manuellement) :**
- Menu latéral → **Database** → **Tables**
- Clique sur une table (ex: `tasks`)
- Cherche un toggle "Enable Realtime" ou "Realtime" dans les paramètres de la table
- Active-le pour `tasks`, `problems`, `folders` et `entities`

### 3. **Vérifier les RLS Policies**
Tes policies RLS doivent déjà être configurées (on l'a fait ensemble).
Pour vérifier :
- **Database** → **Tables** → sélectionne une table → onglet **Policies**
- Vérifie que chaque table a une policy qui autorise `SELECT`, `INSERT`, `UPDATE`, `DELETE`

### 4. **Tester Realtime**
Une fois activé :
1. Redémarre ton serveur Next.js (`Ctrl+C` puis `npm run dev`)
2. Ouvre ton app dans **2 onglets** en même temps
3. Ajoute une tâche ou un problème dans l'onglet 1
4. **L'onglet 2 devrait se mettre à jour automatiquement** 🎉

### 5. **Logs de Debug**
Dans la console du navigateur, tu verras :
```
📡 [Tasks] Setting up Realtime subscription...
📡 [Tasks] Subscription status: SUBSCRIBED
🔥 [Tasks] Realtime event: INSERT {...}
```

Si tu vois `ERROR` ou `TIMED_OUT`, c'est que Realtime n'est pas activé sur la table.

---

## Résultat attendu

✅ **Avant** : Tu devais rafraîchir la page pour voir les changements  
✅ **Après** : Toutes les colonnes se mettent à jour en temps réel, même depuis un autre onglet ou appareil

---

## En cas de problème

### Erreur : `Subscription status: TIMED_OUT`
→ Vérifie que Realtime est bien activé sur la table dans **Database > Replication**

### Erreur : `Subscription status: CHANNEL_ERROR`
→ Vérifie que tes RLS policies autorisent `SELECT` (Realtime nécessite la lecture)

### Aucun log de subscription
→ Vérifie que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont bien dans `.env.local`

---

🎯 **Fait ça et tu auras un vrai temps réel cross-sessions sans aucun effort manuel.**

