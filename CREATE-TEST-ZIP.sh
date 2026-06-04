#!/bin/bash

# CRÉER UN ZIP DE TEST AVEC LES 4 FICHIERS EXCEL

# 1. Créer un dossier temporaire
mkdir -p course-import
cd course-import

# 2. Télécharger ou copier les fichiers Excel dans ce dossier:
# - chapters.xlsx
# - pretest.xlsx
# - formative.xlsx (ou quiz-formatif.xlsx)
# - summative.xlsx

# 3. Créer le ZIP
zip -r course-data.zip chapters.xlsx pretest.xlsx formative.xlsx summative.xlsx

# 4. Le fichier course-data.zip est prêt à uploader!

# STRUCTURE DU ZIP:
# course-data.zip
# ├── chapters.xlsx
# ├── pretest.xlsx
# ├── formative.xlsx
# └── summative.xlsx

# CONTENU DE CHAQUE FICHIER:

# chapters.xlsx:
# Colonnes: ChapitreID, Titre, Contenu, Devoir, Ordre
# 
# pretest.xlsx:
# Colonnes: QuestionID, Ordre, Texte, Type, Choix, Réponse, Points
#
# formative.xlsx:
# Colonnes: QuestionID, ChapitreID, Ordre, Texte, Type, Choix, Réponse, Points
#
# summative.xlsx:
# Colonnes: QuestionID, Ordre, Texte, Type, Choix, Réponse, Points

# Types de questions acceptés: QCM, VRAI_FAUX, QCM_MULTIPLE, OUVERTE, GAP, MATCHING, ORDERING
# Séparateurs de choix acceptés: , (virgule) ou ; (point-virgule)
