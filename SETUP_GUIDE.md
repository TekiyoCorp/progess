# Guide de configuration rapide - Tekiyo Progress

## Étape 1 : Setup Supabase (5 minutes)

### 1.1 Créer le projet Supabase
1. Va sur [supabase.com](https://supabase.com)
2. Sign up / Login
3. Clique sur "New Project"
4. Nomme le projet "tekiyo-progress"
5. Choisis une région proche (ex: Frankfurt)
6. Note le mot de passe de la base de données

### 1.2 Exécuter le script SQL
1. Dans ton projet Supabase, va dans "SQL Editor"
2. Clique sur "New Query"
3. Copie tout le contenu du fichier `supabase-schema.sql`
4. Colle-le dans l'éditeur
5. Clique sur "Run" (en bas à droite)
6. Vérifie que les tables sont créées (onglet "Table Editor")

### 1.3 Récupérer les clés API
1. Va dans "Project Settings" (icône engrenage en bas à gauche)
2. Clique sur "API" dans le menu
3. Note ces 2 valeurs :
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public** (commence par eyJhbG...)
   - **service_role** (commence par eyJhbG..., sous "Service role")

## Étape 2 : Setup Anthropic Claude (2 minutes)

1. Va sur [console.anthropic.com](https://console.anthropic.com)
2. Sign up / Login
3. Va dans "API Keys"
4. Clique sur "Create Key"
5. Nomme la clé "tekiyo-progress"
6. Copie la clé (commence par sk-ant-api03...)

⚠️ **Important** : Cette clé ne sera affichée qu'une seule fois !

## Étape 3 : Configuration locale

### 3.1 Créer le fichier .env.local

À la racine du projet, crée un fichier `.env.local` avec ce contenu :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Google Calendar (Optionnel - laisser vide pour l'instant)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

Remplace les valeurs par celles que tu as notées.

### 3.2 Installer les dépendances

```bash
npm install
```

### 3.3 Lancer le projet

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Étape 4 : Premier test

1. **Ajouter une tâche** : "Call closing projet 15k naturopathe"
   - L'IA devrait lui attribuer ~5%
   
2. **Cocher la tâche** comme complétée
   - La barre de progression devrait passer à 5%
   
3. **Ajouter un blocage** : "Je procrastine avant d'envoyer mon devis"
   - Clique sur "Résoudre avec IA"
   - L'IA devrait te donner des conseils actionnables

4. **Toggle dark mode** : Clique sur l'icône lune/soleil en haut à droite

Si tout fonctionne, tu es prêt ! 🎉

## Problèmes courants

### Erreur Supabase
- Vérifie que les URLs et clés sont correctes
- Vérifie que le script SQL s'est bien exécuté
- Vérifie les policies RLS dans Supabase (elles doivent autoriser les opérations)

### Erreur Claude API
- Vérifie que la clé API est correcte
- Vérifie que tu as des crédits sur ton compte Anthropic
- La clé doit commencer par `sk-ant-api03-`

### Erreur d'installation
```bash
# Supprime node_modules et reinstalle
rm -rf node_modules package-lock.json
npm install
```

### Le projet ne build pas
```bash
# Vérifie les erreurs TypeScript
npm run build
```

## Vérification de la configuration

Pour vérifier que tout est bien configuré, tu peux :

1. Ouvrir la console du navigateur (F12)
2. Ajouter une tâche
3. Vérifier qu'il n'y a pas d'erreurs dans la console

Les logs doivent ressembler à ça :
```
✓ Tâche créée avec succès
✓ Score AI : 5% (type: call)
✓ Progression mise à jour
```

## Google Calendar (Optionnel)

Si tu veux activer la synchro Google Calendar plus tard :

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un nouveau projet "tekiyo-progress"
3. Active l'API "Google Calendar API"
4. Crée des identifiants OAuth 2.0
5. Ajoute `http://localhost:3000/api/auth/callback/google` aux Redirect URIs
6. Note le Client ID et Client Secret
7. Mets-les dans `.env.local`

## Support

Si tu as un problème :
1. Vérifie que toutes les étapes sont bien suivies
2. Vérifie les logs dans la console (F12)
3. Vérifie les variables d'environnement
4. Redémarre le serveur de dev

---

**T'es prêt à gamifier ton business ! Let's go 🔥**


