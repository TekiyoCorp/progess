# 📅 Guide du Calendar Intelligent - Tekiyo Dashboard

## ✨ Fonctionnalités implémentées

### 🎯 Événements Calendar → Tâches normales

Les événements Google Calendar sont **automatiquement synchronisés** et affichés comme des **tâches normales** (plus en opacité réduite) !

---

## 📋 Ce qui a changé

### Avant ❌
```
📅 Call Naturopathe - dans 2h    (40% opacity, séparé)
📅 Meeting design - demain        (40% opacity, séparé)
─────────────────────────────────
⚪ faire vidéo tiktok
⚪ slides insta
```

### Après ✅
```
⚪ Call Naturopathe
   📅 12/04 - 13h45 (éditable!)

⚪ Meeting design  
   📅 15/04 - 10h30 (éditable!)

⚪ faire vidéo tiktok
⚪ slides insta
```

---

## 🎨 Format de date

### **Format affiché** : `12/04 - 13h45`
- `12/04` → Jour/Mois
- `13h45` → Heure:Minutes

### **Édition** : Clique sur la date pour la modifier !
- Format attendu : `12/04 - 13h45`
- **Enter** : Sauvegarder
- **Escape** : Annuler

---

## 🤖 IA de gestion intelligente du calendrier

### 1. **Auto-Sync** 🔄
- Les événements Calendar sont **automatiquement** transformés en tâches
- Vérification des doublons via `event_id`
- Détection des événements pertinents (calls, meetings, deadlines)

### 2. **Smart Sync API** (`/api/calendar/smart-sync`)
- Analyse intelligente des événements
- Génération de tâches avant/après l'événement
- Scoring automatique basé sur le type
- Suggestions et détection de conflits

Exemple :
```
Événement: "Call Naturopathe projet 15k"
↓
L'IA génère automatiquement:
1. ⚪ Préparer call Naturopathe (1%)  [AVANT]
2. ⚪ Call Naturopathe projet 15k (5%)  [PENDANT]
3. ⚪ Envoyer devis si validé (4%)  [APRÈS]
```

### 3. **Détection intelligente**
- **Calls clients** → Tâches de préparation + suivi
- **Meetings** → Agenda + notes de réunion
- **Deadlines** → Rappels progressifs
- **Présentations** → Préparation slides + répétition

---

## 🔧 Architecture

### Composants modifiés

```
components/dashboard/TasksColumn.tsx
├── syncCalendarEventsToTasks()  → Auto-sync des événements
└── useEffect()                  → Déclenchement automatique

components/tasks/TaskItem.tsx
├── formatEventDate()            → Format "12/04 - 13h45"
├── parseEditedDate()            → Parse le format édité
├── handleDateClick()            → Active l'édition
└── handleDateSave()             → Sauvegarde la date

api/calendar/smart-sync/route.ts
└── POST                         → IA intelligente de gestion
```

---

## 🚀 Utilisation

### 1. **Connexion initiale**
1. Clique sur **"Connecter Calendar"**
2. Autorise l'accès à ton Google Calendar
3. **Automatique** : Les événements sont synchro en tâches ! ✨

### 2. **Modifier une date**
1. **Clique** sur la date d'une tâche (ex: `📅 12/04 - 13h45`)
2. **Modifie** le format : `15/04 - 16h30`
3. **Enter** pour sauvegarder

### 3. **Sync manuel** (si besoin)
- Clique sur **"Sync Calendar"** pour rafraîchir

---

## 📊 Workflow intelligent

### Scénario : Meeting client dans 2 jours

**Google Calendar** :
```
Meeting Client TechCorp
15/04/2025 - 14h00
```

**L'IA génère automatiquement** :
```
⚪ Préparer agenda meeting TechCorp (1%)
   📅 14/04 - 18h00 (la veille)

⚪ Meeting Client TechCorp (5%)
   📅 15/04 - 14h00

⚪ Envoyer compte-rendu TechCorp (2%)
   📅 15/04 - 16h00 (après le meeting)
```

---

## 🎯 Avantages de ce système

### ✅ **Plus besoin de** :
- ❌ Affichage séparé des événements Calendar
- ❌ Opacité réduite qui rend illisible
- ❌ Dupliquer manuellement les événements en tâches

### ✅ **Tu peux maintenant** :
- ✅ Voir tous les événements comme des tâches normales
- ✅ Modifier les dates directement
- ✅ Organiser les événements dans des dossiers
- ✅ Drag & drop des événements Calendar
- ✅ Cocher les événements une fois terminés

---

## 🔮 Améliorations futures (optionnel)

### 1. **Bi-directionnel**
- Modifier une tâche → Met à jour Google Calendar
- Créer une tâche avec date → Crée événement Calendar

### 2. **Smart Scheduling**
- L'IA suggère les meilleurs créneaux
- Détection des conflits d'horaires
- Optimisation du planning

### 3. **Rappels intelligents**
- Notifications avant les événements
- Préparation automatique des tâches
- Recap quotidien le matin

### 4. **Analytics**
- Temps passé par type d'événement
- Productivité par créneau horaire
- Suggestions d'optimisation

---

## 🐛 Dépannage

### Les événements ne se synchronisent pas
➡️ Vérifie dans la console :
```
🔄 [Sync] Syncing X calendar events to tasks...
➕ [Sync] Creating task from event: Meeting...
✅ [Sync] Calendar events synced to tasks
```

### La date ne se modifie pas
➡️ Respecte le format : `12/04 - 13h45`
- Jour sur 2 chiffres (01-31)
- Mois sur 2 chiffres (01-12)
- Heure sur 2 chiffres (00-23)
- Minutes sur 2 chiffres (00-59)

### Doublons d'événements
➡️ Le système détecte les doublons via `event_id`
- Chaque événement n'est créé qu'une seule fois
- Le refresh ne crée pas de doublons

---

## 💡 Astuces

### Format de date rapide
- `12/04 - 13h45` : Format complet
- Utilise **Tab** pour passer aux champs suivants
- **Enter** pour valider rapidement

### Organisation par type
- 📞 **Calls** → Dossier "Calls Clients"
- 💼 **Meetings** → Dossier "Réunions"
- 🎯 **Deadlines** → Dossier "Urgences"

### Workflow optimal
1. Connecte Google Calendar une seule fois
2. Les événements se synchronisent automatiquement
3. Organise-les dans des dossiers si besoin
4. Coche quand c'est fait ! ✅

---

✨ **C'est prêt !** Tes événements Calendar sont maintenant des **tâches normales éditables** ! 🚀

**Connecte ton Google Calendar et regarde la magie opérer ! 📅→⚪**


