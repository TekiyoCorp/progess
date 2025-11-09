# Variables d'environnement

## Variables requises pour Resend

Pour activer l'envoi d'emails quotidiens via Resend, ajoutez ces variables dans votre fichier `.env.local` :

```bash
# Resend API Key (obtenu depuis https://resend.com/api-keys)
RESEND_API_KEY=re_your_resend_api_key_here

# Email d'envoi Resend (optionnel, défaut: onboarding@resend.dev pour les tests)
# Pour la production, utilisez votre domaine vérifié: noreply@yourdomain.com
RESEND_FROM_EMAIL=onboarding@resend.dev

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Secret pour sécuriser le cron job (générer une chaîne aléatoire)
CRON_SECRET=your_random_secret_string_here

# Objectif mensuel (optionnel, défaut: 50000)
MONTHLY_GOAL=50000
```

## Comment obtenir votre clé API Resend

1. Connectez-vous à [Resend](https://resend.com)
2. Allez dans **API Keys**
3. Créez une nouvelle clé API
4. Copiez la clé (commence par `re_`)
5. Ajoutez-la dans `.env.local` comme `RESEND_API_KEY`

## Configuration du Cron Job Vercel

Le cron job est déjà configuré dans `vercel.json` pour s'exécuter tous les jours à 9h00.

Pour le sécuriser, ajoutez `CRON_SECRET` dans vos variables d'environnement Vercel :
1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez `CRON_SECRET` avec une valeur aléatoire
4. Ajoutez aussi `RESEND_API_KEY` et `NEXT_PUBLIC_APP_URL`

## Variables existantes

Les autres variables d'environnement nécessaires :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`


