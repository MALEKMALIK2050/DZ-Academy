# 📱 CBA Mobile - Structure des Écrans

## 🎯 Plan d'implémentation

### 1️⃣ MODIFIER: `src/app/_layout.tsx`
Ajouter logique : **Si pas de token → afficher Login, sinon → Navigation**

### 2️⃣ CRÉER: `src/app/index.tsx`
**Login Screen** avec logo CBA + formulaire email/password

### 3️⃣ CRÉER: `src/app/(tabs)/index.tsx`
**Dashboard** - Liste des cours de l'étudiant

### 4️⃣ MODIFIER: `src/app/(tabs)/explore.tsx`
**Catalogue** - Tous les cours disponibles (déjà existe)

### 5️⃣ CRÉER: `src/app/(tabs)/profile.tsx`
**Profil** - Infos étudiant + logout

### 6️⃣ CRÉER: `src/app/course/[id].tsx`
**Détails du cours** - Chapitres + progression

### 7️⃣ CRÉER: `src/app/chapter/[id].tsx`
**Contenu du chapitre** - Vidéo/texte + quiz

### 8️⃣ CRÉER: `src/app/quiz/[id].tsx`
**Quiz** - Questions/réponses

### 9️⃣ CRÉER: `src/hooks/useCourses.ts`
Hook personnalisé pour récupérer les cours depuis l'API

### 🔟 CRÉER: `src/components/course-card.tsx`
Composant réutilisable pour afficher un cours

---

## 📂 Structure finale

```
src/
├── app/
│   ├── _layout.tsx (MODIFIED)
│   ├── index.tsx (LOGIN SCREEN)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx (DASHBOARD)
│   │   ├── explore.tsx (CATALOGUE)
│   │   └── profile.tsx (PROFIL)
│   ├── course/
│   │   └── [id].tsx (COURSE DETAILS)
│   ├── chapter/
│   │   └── [id].tsx (CHAPTER CONTENT)
│   └── quiz/
│       └── [id].tsx (QUIZ)
├── components/
│   ├── course-card.tsx (NEW)
│   ├── course-progress.tsx (NEW)
│   └── ... (existants)
├── hooks/
│   └── useCourses.ts (NEW)
└── ...
```

---

## 🎨 Couleurs à utiliser

```typescript
const Colors = {
  primary: '#16A34A',    // Vert CBA
  secondary: '#F97316',  // Orange CBA
  accent: '#208AEF',     // Bleu splash
  danger: '#DC2626',     // Rouge (erreurs)
  success: '#22C55E',    // Vert succès
};
```

---

## ✅ Dépendances déjà installées

- ✅ expo-router
- ✅ react-native
- ✅ async-storage
- ✅ react-native-safe-area-context
- ✅ expo-image
- ✅ typescript

**Aucune dépendance supplémentaire à installer !**

---

## 🚀 Étapes de création

1. D'abord : créer les **dossiers** manquants
2. Ensuite : créer les **fichiers** un par un
3. Enfin : tester le **flow complet**

**Prêt à commencer ?** 🎯
