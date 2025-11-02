# Guide d'upload du logo Tekiyo

## Emplacement actuel

Pour le moment, un placeholder avec la lettre "T" est affiché dans la colonne Progress.

Le composant qui gère l'affichage est : `components/progress/LogoPlaceholder.tsx`

## Comment remplacer par ton logo SVG

### Option 1 : Upload dans /public

1. Place ton fichier SVG dans `/public/tekiyo-logo.svg`

2. Remplace le contenu de `components/progress/LogoPlaceholder.tsx` par :

```tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function LogoPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center mb-8"
    >
      <div className="relative">
        <div className="absolute inset-0 tekiyo-glow rounded-full blur-xl" />
        <div className="relative w-24 h-24 flex items-center justify-center">
          <Image
            src="/tekiyo-logo.svg"
            alt="Tekiyo Logo"
            width={96}
            height={96}
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>
    </motion.div>
  );
}
```

### Option 2 : Inline SVG (Recommandé pour le glow effect)

Si tu veux un meilleur contrôle du glow effect et des animations :

1. Copie le code SVG de ton logo

2. Remplace le contenu de `components/progress/LogoPlaceholder.tsx` par :

```tsx
'use client';

import { motion } from 'framer-motion';

export function LogoPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center mb-8"
    >
      <div className="relative">
        <div className="absolute inset-0 tekiyo-glow rounded-full blur-xl" />
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Colle ton code SVG ici */}
          <svg
            width="96"
            height="96"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Ton SVG content ici */}
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
```

### Option 3 : Logo externe (URL)

Si ton logo est hébergé ailleurs :

```tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function LogoPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center mb-8"
    >
      <div className="relative">
        <div className="absolute inset-0 tekiyo-glow rounded-full blur-xl" />
        <div className="relative w-24 h-24 flex items-center justify-center">
          <Image
            src="https://ton-url.com/logo.svg"
            alt="Tekiyo Logo"
            width={96}
            height={96}
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>
    </motion.div>
  );
}
```

N'oublie pas d'ajouter le domaine dans `next.config.ts` :

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ton-url.com',
      },
    ],
  },
};
```

## Customisation du glow effect

Le glow effect bleu Tekiyo est défini dans la classe `tekiyo-glow` (`app/globals.css`).

Si tu veux ajuster l'intensité ou la couleur :

```css
.tekiyo-glow {
  box-shadow: 
    0 0 20px rgba(0, 113, 227, 0.3),  /* Proximité */
    0 0 40px rgba(0, 113, 227, 0.2),  /* Moyen */
    0 0 60px rgba(0, 113, 227, 0.1);  /* Lointain */
}
```

Augmente les valeurs (0.3 → 0.5) pour un glow plus intense.

## Taille du logo

Pour changer la taille du logo, modifie les classes `w-24 h-24` (24 = 96px) :

- `w-20 h-20` = 80px
- `w-24 h-24` = 96px (actuel)
- `w-32 h-32` = 128px
- `w-40 h-40` = 160px

## Animation au chargement

L'animation actuelle fait :
- Fade in (opacity 0 → 1)
- Scale up (0.9 → 1)
- Durée : 0.5s

Pour une animation plus dynamique :

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
  animate={{ opacity: 1, scale: 1, rotate: 0 }}
  transition={{ 
    duration: 0.7,
    ease: 'easeOut'
  }}
  className="flex items-center justify-center mb-8"
>
```

## Animation de rotation permanente

Pour un logo qui tourne légèrement (effet premium) :

```tsx
<motion.div
  animate={{ 
    rotate: [0, 5, 0, -5, 0],
  }}
  transition={{
    duration: 8,
    repeat: Infinity,
    ease: 'easeInOut'
  }}
  className="relative w-24 h-24"
>
```

---

**Une fois ton logo uploadé, relance le dev server pour voir les changements :**

```bash
npm run dev
```


