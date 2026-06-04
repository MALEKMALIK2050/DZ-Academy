🔧 PRISMA - ÉTAPES EXACTES À EXÉCUTER
═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 1️⃣ : SAUVEGARDE (IMPORTANT!)
───────────────────────────────────────────────────────────────────────────────

Si PostgreSQL:
$ pg_dump nom_base_de_donnees > backup_$(date +%Y%m%d_%H%M%S).sql

Si MySQL:
$ mysqldump -u root -p nom_base_de_donnees > backup_$(date +%Y%m%d_%H%M%S).sql

Si SQLite:
$ cp prisma/dev.db prisma/dev.db.backup


ÉTAPE 2️⃣ : METTRE À JOUR schema.prisma
───────────────────────────────────────────────────────────────────────────────

1. Ouvrir: prisma/schema.prisma

2. Ajouter les ÉNUMS en haut (après generator/datasource):

```prisma
enum Role {
  STUDENT
  TEACHER
  DESIGNER
  ADMIN
}

enum NiveauScolaire {
  PRIMAIRE
  CEM
  LYCEE
  BAC
  LICENCE
  MASTER
  DOCTORAT
}

enum StatutProfilCompletion {
  INCOMPLET
  PARTIELLEMENT_COMPLET
  COMPLET
}
```

3. Remplacer le model User par celui de schema_user_complet.prisma

4. Sauvegarder


ÉTAPE 3️⃣ : CRÉER LA MIGRATION
───────────────────────────────────────────────────────────────────────────────

Terminal (dans le dossier projet):

$ npx prisma migrate dev --name update_user_fields

Répondre YES si demandé.

Attendre la fin (le message: "✓ Generated Prisma Client")


ÉTAPE 4️⃣ : VÉRIFIER LA MIGRATION
───────────────────────────────────────────────────────────────────────────────

$ npx prisma studio

✓ Ouvrir http://localhost:5555
✓ Cliquer sur "User" dans le menu
✓ Vérifier que les nouveaux champs sont là:
  - lieuNaissance
  - pays
  - pourcentageCompletion
  - statutProfil
  - updatedAt
  - lastLoginAt
  - deletedAt

✓ Fermer le studio (Ctrl+C)


ÉTAPE 5️⃣ : GÉNÉRER PRISMA CLIENT
───────────────────────────────────────────────────────────────────────────────

$ npx prisma generate

Attendre ✓ Done


ÉTAPE 6️⃣ : VÉRIFIER LES TYPES (TypeScript)
───────────────────────────────────────────────────────────────────────────────

$ npm run build

Si erreur TypeScript:
└─ Vérifier que les types Prisma sont importés correctement


ÉTAPE 7️⃣ : TESTER LE DÉMARRAGE
───────────────────────────────────────────────────────────────────────────────

$ npm run dev

Attendre: "ready - started server on 0.0.0.0:3000"


═══════════════════════════════════════════════════════════════════════════════

✅ SI TOUT VA BIEN:

Toutes les étapes ci-dessus complétées sans erreur → ✅ OK pour étape suivante


⚠️ SI ERREUR:

ERREUR: "Can't reach database server"
FIX: Vérifier que la BD est en cours d'exécution
    $ docker ps (pour Docker)
    ou relancer MongoDB/PostgreSQL


ERREUR: "Prisma schema validation"
FIX: Copier le schema_user_complet.prisma entièrement
     Vérifier la syntaxe


ERREUR: "Cannot find name 'StatutProfilCompletion'"
FIX: C'est normal - le Prisma Client sera généré à l'étape 5


═══════════════════════════════════════════════════════════════════════════════

🚀 APRÈS PRISMA - PROCHAINE ÉTAPE:

Créer les endpoints API:
├─ pages/api/profile/me.js
├─ pages/api/profile/update.js
└─ pages/api/profile/change-password.js

(Voir: API_PROFILE_ENDPOINTS.js pour le code)


═══════════════════════════════════════════════════════════════════════════════

RÉSUMÉ DES COMMANDES:

$ pg_dump nom_bd > backup.sql           # Backup
$ npx prisma migrate dev --name update   # Migration
$ npx prisma studio                      # Vérifier
$ npx prisma generate                    # Generate
$ npm run build                          # Test TypeScript
$ npm run dev                            # Démarrer

═══════════════════════════════════════════════════════════════════════════════

⏱️ TEMPS TOTAL: ~5 minutes

═══════════════════════════════════════════════════════════════════════════════
