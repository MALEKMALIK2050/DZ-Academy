# 🎯 ARCHITECTURE IMPORT ZIP UNIFIÉ

## 📋 FICHIERS À CRÉER

### 1. BASE DE DONNÉES
```
prisma/schema.prisma
  → Ajouter le modèle ImportBatch
  → npx prisma migrate dev --name add_import_batch
```

### 2. APIs (pages/api/import-course/)
```
✅ upload-zip.js               → Reçoit ZIP, extrait, crée batch
✅ process-batch.js            → Traite les 4 modules EN PARALLÈLE
✅ batch-status.js             → Retourne le statut du batch
✅ batch-retry.js              → Retry les modules échoués
```

### 3. PAGE FRONTEND
```
pages/dashboard/designer/courses/[id]/import-zip.js
  → Upload ZIP
  → Affiche statuts en temps réel
  → Permet retry sur modules échoués
```

### 4. DÉPENDANCES
```bash
npm install archiver extract-zip
```

---

## 🔄 FLUX DE TRAVAIL

### Phase 1: UPLOAD
```
User upload ZIP
    ↓
upload-zip.js
  ├─ Valide le fichier
  ├─ Extrait le ZIP
  ├─ Crée ImportBatch
  └─ Retourne batchId + extractDir
```

### Phase 2: TRAITEMENT PARALLÈLE
```
process-batch.js traite les 4 modules SIMULTANÉMENT:

┌──────────────────────────────────────────┐
│  Promise.all([                           │
│    processChapters(),                    │
│    processPretest(),                     │
│    processFormative(),                   │
│    processSummative()                    │
│  ])                                      │
└──────────────────────────────────────────┘

Chaque module:
  ✅ Succès → statut SUCCESS + count
  ❌ Erreur → statut FAILED + error message
  ⏭️ N'attend pas les autres
```

### Phase 3: POLLING STATUT
```
Frontend poll toutes les 2 secondes:
  GET /api/import-course/batch-status?batchId=X
    ↓
Affiche les statuts en temps réel
```

### Phase 4: RETRY (optionnel)
```
Si PARTIAL_FAIL:
  POST /api/import-course/batch-retry
    ↓
Réinitialise les modules échoués
    ↓
Frontend relance process-batch pour modules échoués seulement
```

---

## 📊 STRUCTURE IMPORTBATCH

```javascript
{
  id: 1,
  courseId: 5,
  status: "COMPLETED" | "IN_PROGRESS" | "PARTIAL_FAIL",
  
  chaptersStatus: "SUCCESS" | "FAILED" | "PENDING",
  chaptersCreated: 12,
  chaptersError: null,
  
  pretestStatus: "SUCCESS",
  pretestCreated: 20,
  pretestError: null,
  
  formativeStatus: "FAILED",
  formativeCreated: 0,
  formativeError: "Aucune question formative trouvée",
  
  summativeStatus: "SUCCESS",
  summativeCreated: 50,
  summativeError: null,
  
  startedAt: 2024-01-15T10:00:00Z,
  completedAt: 2024-01-15T10:05:30Z,
}
```

---

## 🎯 AVANTAGES

✅ **Imports PARALLÈLES** → Plus rapide
✅ **Isolation des erreurs** → Un module échoue ≠ bloquer les autres
✅ **Retry SÉLECTIF** → Réimporter seulement les modules échoués
✅ **Tracking COMPLET** → Historique des imports
✅ **Scalable** → Ajouter des modules facile
✅ **User-friendly** → Interface de feedback en temps réel

---

## 🛠️ ÉTAPES D'INTÉGRATION

1. Ajouter le modèle ImportBatch au schema Prisma
2. Installer les dépendances: `npm install archiver extract-zip`
3. Créer les 4 fichiers API
4. Créer la page frontend d'import
5. Ajouter un bouton dans la page du cours:
   ```javascript
   <button onClick={() => router.push(`/dashboard/designer/courses/${id}/import-zip`)}>
     📦 Import ZIP Unifié
   </button>
   ```
6. Tester avec un ZIP contenant les 4 fichiers Excel

---

## 📦 FORMAT ZIP ATTENDU

```
course-data.zip
├── chapters.xlsx
├── pretest.xlsx
├── formative.xlsx
└── summative.xlsx
```

---

## ✅ PRÊT À INTÉGRER!
