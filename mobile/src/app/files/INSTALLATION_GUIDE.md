# 📱 CBA Mobile - Guide d'installation des écrans

## ✅ Fichiers créés

7 fichiers TypeScript/React à copier dans votre projet :

1. **`src/app/_layout.tsx`** (modifier existant)
2. **`src/app/index.tsx`** (login screen - remplacer existant)
3. **`src/app/(tabs)/index.tsx`** (dashboard - créer nouveau)
4. **`src/app/(tabs)/profile.tsx`** (profil - créer nouveau)
5. **`src/app/course/[id].tsx`** (détails cours)
6. **`src/app/chapter/[id].tsx`** (contenu chapitre)
7. **`src/app/quiz/[id].tsx`** (quiz)

---

## 🚀 Instructions d'installation

### Option A : Copier-coller (Plus simple)

1. Ouvrez chaque fichier créé dans `/home/claude/`
2. Copiez le contenu entier
3. Dans votre projet, créez/remplacez le fichier correspondant
4. Sauvegardez

**Ordre recommandé :**
```
1. src/app/_layout.tsx
2. src/app/index.tsx
3. src/app/(tabs)/index.tsx
4. src/app/(tabs)/profile.tsx
5. src/app/course/[id].tsx
6. src/app/chapter/[id].tsx
7. src/app/quiz/[id].tsx
```

### Option B : Via PowerShell (Plus rapide)

```powershell
# Depuis votre projet, exécutez:
# (remplacez les chemins source)

Copy-Item ".\src\app\_layout.tsx" ".\src\app\_layout.tsx.backup"
Copy-Item "C:\chemin\vers\1-_layout.tsx" ".\src\app\_layout.tsx"

Copy-Item ".\src\app\index.tsx" ".\src\app\index.tsx.backup"
Copy-Item "C:\chemin\vers\2-index.tsx" ".\src\app\index.tsx"

# ... et ainsi de suite pour les autres fichiers
```

---

## ⚠️ Avant de démarrer

### 1️⃣ Vérifier les chemins

Tous les fichiers utilisent :
```typescript
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS } from '@/constants/api';
import { Spacing, BottomTabInset } from '@/constants/theme';
```

**Vérifiez que ces fichiers existent :** ✅ (vous les avez)

### 2️⃣ Logo CBA

Le logo doit être à : @/assets/images/cba-logo.png`
```powershell
# Vérifier
Test-Path "@\assets\images\cba-logo.png"
```

### 3️⃣ Constantes de couleurs

Les fichiers utilisent une palette de couleurs :
```typescript
const Colors = {
  primary: '#16A34A',    // Vert CBA
  secondary: '#F97316',  // Orange CBA
  accent: '#208AEF',     // Bleu splash
  danger: '#DC2626',     // Rouge
  success: '#22C55E',    // Vert succès
  lightGray: '#F3F4F6',  // Gris clair
  darkGray: '#6B7280',   // Gris foncé
};
```

**Optionnel :** créer `src/constants/colors.ts` pour centraliser :

```typescript
// src/constants/colors.ts
export const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  accent: '#208AEF',
  danger: '#DC2626',
  success: '#22C55E',
  lightGray: '#F3F4F6',
  darkGray: '#6B7280',
};
```

---

## 🧪 Tester après installation

### 1️⃣ Arrêter et relancer Expo

```powershell
# Arrêter (Ctrl+C)
npm start
```

### 2️⃣ Vérifier qu'il n'y a pas d'erreurs

Vous devriez voir :
```
✓ Compiled successfully
Metro bundler ready
```

### 3️⃣ Tester le flow complet

**Sur votre téléphone :**

1. **Login screen** → Entrez email/password (ex: étudiant@example.com)
2. **Dashboard** → Voir liste des cours (si API retourne des courses)
3. **Cliquez sur un cours** → Voir détails + chapitres
4. **Cliquez sur un chapitre** → Voir contenu + quiz
5. **Quiz** → Répondre aux questions
6. **Profile** → Voir infos + logout

---

## ⚡ Dépannage courant

### "Module not found: @/context/auth-context"
✅ Vous avez ce fichier, pas de problème

### "Module not found: ThemedText"
✅ Vous avez ce fichier aussi

### Login screen ne s'affiche pas
Vérifiez `src/app/_layout.tsx` :
```typescript
if (!token) {
    return <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>;
}
```

### Dashboard montre "Aucun cours"
L'API retourne peut-être vide. Vérifiez :
```powershell
# Vérifier l'endpoint courses
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/student/courses
```

### Couleurs ne correspondent pas
Modifiez les variables `Colors` au début de chaque fichier

---

## 📝 Prochaines étapes

Après avoir copié les fichiers :

1. ✅ Testez le login
2. ✅ Vérifiez que les cours s'affichent
3. ✅ Testez la navigation entre écrans
4. ✅ Vérifiez que le logout fonctionne
5. ⏭️ (Optionnel) Créer composants réutilisables (CourseCard, etc.)
6. ⏭️ (Optionnel) Ajouter animations
7. ⏭️ (Optionnel) Deployer sur iOS/Android

---

## 🎯 Résumé rapide

| Fichier | Action | Destination |
|---------|--------|-------------|
| 1-_layout.tsx | Remplacer | `src/app/_layout.tsx` |
| 2-index.tsx | Remplacer | `src/app/index.tsx` |
| 3-dashboard-index.tsx | Créer | `src/app/(tabs)/index.tsx` |
| 4-profile.tsx | Créer | `src/app/(tabs)/profile.tsx` |
| 5-course-id.tsx | Créer | `src/app/course/[id].tsx` |
| 6-chapter-id.tsx | Créer | `src/app/chapter/[id].tsx` |
| 7-quiz-id.tsx | Créer | `src/app/quiz/[id].tsx` |

---

**Prêt à commencer ? Lancez `npm start` après avoir copié les fichiers !** 🚀
