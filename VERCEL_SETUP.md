# 🚀 Configuration Vercel

## ❌ Erreur actuelle

```
Error: Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.
```

## ✅ Solution : Configurer les variables d'environnement

### 1. Va sur Vercel Dashboard
👉 https://vercel.com/dashboard

### 2. Sélectionne ton projet
Clique sur **TekiyoCorp/progess**

### 3. Va dans Settings → Environment Variables
Ou directement : `https://vercel.com/[ton-username]/progess/settings/environment-variables`

### 4. Ajoute ces variables d'environnement :

#### **OpenAI** (REQUIS)
```
OPENAI_API_KEY=sk-proj-...
```

#### **Supabase** (REQUIS)
```
NEXT_PUBLIC_SUPABASE_URL=https://cvdxhartnemojqomucol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

#### **Google Calendar** (OPTIONNEL - pour plus tard)
```
GOOGLE_CLIENT_ID=321323547375-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://ton-app.vercel.app/api/auth/callback/google
```

### 5. Redéployer

Après avoir ajouté les variables :
1. Clique sur **Deployments**
2. Clique sur les **3 points** du dernier déploiement
3. Clique sur **Redeploy**

Ou push un nouveau commit :
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## 📌 Notes importantes

- Les variables `NEXT_PUBLIC_*` sont exposées au client
- `SUPABASE_SERVICE_ROLE_KEY` et `OPENAI_API_KEY` restent côté serveur
- Le `GOOGLE_REDIRECT_URI` doit pointer vers ton domaine Vercel

## 🎯 Une fois configuré

Ton app sera live en 2-3 minutes ! 🚀

