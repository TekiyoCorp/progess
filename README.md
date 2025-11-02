# Tekiyo Progress Dashboard

Dashboard gamifié pour suivre la progression business de Tekiyo vers l'objectif de 50 000€/mois.

## Features

- **Gestion de tâches** avec scoring AI automatique (Claude)
- **Barre de progression** animée et gamifiée
- **Problem Solver AI** pour débloquer les situations complexes
- **Dark mode** avec thème premium Tekiyo
- **Animations fluides** avec Framer Motion
- **Design glassmorphism** moderne et élégant
- **Responsive** - fonctionne sur mobile, tablette et desktop
- **Accessible** - ARIA labels et navigation clavier
- **Reset mensuel** automatique avec archivage

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components:** Shadcn/ui
- **Animations:** Framer Motion, Canvas Confetti
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude 3.5 Sonnet (Anthropic)
- **Styling:** Glassmorphism, Custom Tekiyo theme

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Calendar (Optionnel)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

### 3. Configuration de la base de données Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Exécutez le script SQL du fichier `supabase-schema.sql` dans l'éditeur SQL Supabase
4. Récupérez vos clés API dans Project Settings > API

### 4. Configuration de l'API Claude

1. Créez un compte sur [Anthropic](https://console.anthropic.com)
2. Générez une clé API
3. Ajoutez-la dans votre `.env.local`

### 5. Lancer le projet

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du projet

```
/app
  /api
    /score-task       # API route pour scorer les tâches avec Claude
    /solve-problem    # API route pour résoudre les blocages
    /calendar/sync    # API route pour synchro Google Calendar
  layout.tsx          # Layout principal
  page.tsx            # Page d'accueil (dashboard)
  globals.css         # Styles globaux + thème Tekiyo

/components
  /dashboard
    - DashboardLayout.tsx    # Layout 3 colonnes
    - TasksColumn.tsx        # Colonne tâches
    - ProgressColumn.tsx     # Colonne progression
    - ProblemsColumn.tsx     # Colonne blocages
  /tasks                     # Composants tâches
  /progress                  # Composants progression
  /problems                  # Composants blocages
  /ui                        # Composants Shadcn/ui

/hooks
  - useTasks.ts       # Hook gestion tâches
  - useProgress.ts    # Hook calcul progression
  - useProblems.ts    # Hook gestion blocages
  - useDarkMode.ts    # Hook dark mode

/lib
  - supabase.ts       # Client Supabase
  - claude.ts         # Client Claude AI
  - calendar.ts       # Google Calendar integration
  - utils.ts          # Fonctions utilitaires
  - monthly-reset.ts  # Logique reset mensuel

/types
  - index.ts          # Types TypeScript
```

## Système de scoring AI

Le système utilise Claude pour analyser automatiquement chaque tâche et lui attribuer un pourcentage de progression :

- **8-10%** : Signature contrat, validation projet majeur
- **4-6%** : Call closing, devis qualifié, livraison
- **2-3%** : Proposition, TikTok, call qualif
- **1%** : Emails, follow-ups, préparation

L'IA détecte les mots-clés, montants, types de clients et étapes du funnel.

## Problem Solver AI

Chaque blocage peut être résolu avec l'IA qui fournit :
1. Analyse du problème
2. Solution immédiate (24h)
3. Solution long terme
4. Rappel mindset anti-perfectionnisme

## Reset mensuel automatique

Le système vérifie automatiquement chaque jour si un nouveau mois a commencé :
- Archive les données du mois précédent
- Reset la progression à 0%
- Conserve l'historique dans `monthly_archives`

## Customisation du design

Le thème Tekiyo est défini dans `app/globals.css` :
- Couleur principale : Tekiyo Blue (#0071E3)
- Glassmorphism : backdrop-blur + transparence
- Dark mode : Variables CSS adaptatives
- Fonts : SF Pro Display / Inter Display

## Google Calendar (Optionnel)

Pour activer la synchronisation Google Calendar :
1. Créez un projet sur Google Cloud Console
2. Activez l'API Google Calendar
3. Créez des identifiants OAuth 2.0
4. Ajoutez les variables d'environnement
5. Utilisez `/api/calendar/sync` avec un access token

## Scripts disponibles

```bash
npm run dev      # Lancer en développement
npm run build    # Build pour production
npm run start    # Lancer en production
npm run lint     # Linter le code
```

## Notes importantes

- Le projet utilise Tailwind CSS v4
- Les animations utilisent Framer Motion
- Le design est optimisé pour Chrome/Safari/Edge
- Mobile-first approach avec breakpoints responsive

## Prochaines améliorations

- [ ] OAuth Google Calendar complet
- [ ] Sound effects optionnels
- [ ] Interface de visualisation des archives
- [ ] Analytics et statistiques avancées
- [ ] Export PDF des rapports mensuels
- [ ] Intégration Stripe pour tracking CA réel
- [ ] Notifications push pour rappels
- [ ] Mode focus / Pomodoro

## Support

Pour toute question ou problème :
- Ouvre une issue sur GitHub
- Contact : zak@tekiyo.com

---

**Made with 🔥 by Tekiyo - Let's fucking go!**
