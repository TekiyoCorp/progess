# ⚡ Guide des Slash Commands - Tekiyo Dashboard

## ✨ Fonctionnalités implémentées

### 🎯 Slash Commands (comme Notion !)

Tape **`/`** dans l'input de tâches pour ouvrir un menu de commandes rapides !

---

## 📋 Commandes disponibles

### 1. **📅 Ajouter au Calendar**
- **Raccourci** : `/` → Sélectionne "Ajouter au Calendar"
- **Description** : Créer un événement Google Calendar directement
- **Status** : 🚧 En cours (alerte temporaire)

### 2. **✨ Tâches depuis événement**
- **Raccourci** : `/` → Sélectionne "Tâches depuis événement"
- **Description** : Générer automatiquement des tâches depuis un événement Google Calendar
- **Status** : 🚧 En cours (alerte temporaire)

### 3. **📁 Créer un dossier**
- **Raccourci** : `/` → Sélectionne "Créer un dossier"
- **Description** : Créer un nouveau dossier pour organiser les tâches
- **Status** : 🚧 En cours (alerte temporaire)

### 4. **⚠️ Résoudre un problème**
- **Raccourci** : `/` → Sélectionne "Résoudre un problème"
- **Description** : Ajouter directement dans la colonne Problèmes avec IA
- **Status** : 🚧 En cours (alerte temporaire)

---

## 📅 Événements Google Calendar

### Affichage automatique
- ✅ **Fetch automatique** des événements Calendar après connexion
- ✅ **Affichage avec faible opacité** (40%) au-dessus des tâches
- ✅ **Limite** : 5 prochains événements affichés
- ✅ **Format** : "Nom de l'événement" + "dans X heures/jours"

### Design minimaliste
```
Tâches
├── 📅 Connecter Calendar
├── 📅 Call Naturopathe - dans 2 heures     (40% opacity)
├── 📅 Meeting design - demain             (40% opacity)
├── 📅 Deadline projet - dans 3 jours      (40% opacity)
├── ─────────────────────────────────────
├── 📁 Dossier Closing Naturopathe (3)
│   ├── ⚪ Préparer call
│   └── ⚪ Envoyer devis
├── ⚪ faire vidéo tiktok
└── [+ Ajouter une tâche ou tapez /]
```

---

## 🎨 Navigation du menu slash

### Clavier
- **↑/↓** : Naviguer dans le menu
- **Enter** : Sélectionner une commande
- **Escape** : Fermer le menu

### Souris
- **Hover** : Surligner une option
- **Click** : Sélectionner une commande

---

## 🚀 Utilisation

### 1. **Fetch tes événements Calendar**

1. Si pas encore connecté : Clique sur **"Connecter Calendar"**
2. Autorise l'accès à ton Google Calendar
3. Les événements apparaissent automatiquement ! 📅

### 2. **Utiliser les slash commands**

1. **Clique** sur l'input "Ajouter une tâche"
2. **Tape** `/`
3. **Un menu apparaît** avec 4 options
4. **Sélectionne** avec ↑/↓ et Enter (ou souris)
5. **L'action se lance** ! ⚡

---

## 📦 Composants créés

```
hooks/
└── useCalendarEvents.ts        → Fetch événements Calendar

components/
├── calendar/
│   └── CalendarEventItem.tsx  → Item événement (faible opacité)
├── tasks/
│   ├── SlashCommandMenu.tsx   → Menu slash commands
│   └── TaskInput.tsx          → Input avec support "/"

api/
└── calendar/
    └── events/route.ts         → API fetch événements
```

---

## 🔧 API Routes

### **POST `/api/calendar/events`**
- **Input** : `{ accessToken: string }`
- **Output** : `{ events: CalendarEvent[], count: number }`
- **Description** : Récupère les 50 prochains événements

---

## 🎯 Prochaines étapes (optionnel)

1. **Implémenter les actions complètes** :
   - Modal pour créer événement Calendar
   - Sélecteur d'événements pour générer tâches
   - Création rapide de dossier
   - Ajout direct dans colonne Problèmes

2. **Interactions avec événements** :
   - Click sur événement → Générer tâches automatiquement
   - Drag événement → Créer tâche avec date
   - Badge compteur d'événements

3. **Améliorations UX** :
   - Recherche dans le menu slash
   - Commandes personnalisées
   - Historique des commandes

---

## 💡 Astuces

### Raccourcis clavier (à venir)
- `Cmd + /` : Ouvrir le menu slash directement
- `Cmd + K` : Quick actions
- `Cmd + E` : Afficher/Cacher événements

### Workflow optimal
1. Connecte ton Google Calendar
2. Les événements apparaissent automatiquement
3. Tape `/` pour actions rapides
4. Crée des tâches ou dossiers en 2 secondes ! ⚡

---

✨ **C'est prêt !** Tape **`/`** dans l'input pour voir le menu ! 🚀

**Note** : Les actions complètes (modales, formulaires) seront implémentées dans les prochaines itérations. Pour l'instant, des alertes confirment que les commandes sont détectées ! 📋


