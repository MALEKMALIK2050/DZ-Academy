const XLSX = require('xlsx');
const path = require('path');

/**
 * Générer un fichier Excel template vierge
 */
function generateExcelTemplate(outputPath) {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // ===== SHEET 1: COURS =====
  const coursData = [
    {
      Titre: 'Les Transformations Géométriques',
      Matière: 'Mathématiques',
      Niveau: '4ème collège',
      Année: '4ème',
      Description: 'Cours sur la translation et la rotation',
      Objectifs: 'Comprendre la translation;Comprendre la rotation;Appliquer les transformations',
    },
  ];
  const coursSheet = XLSX.utils.json_to_sheet(coursData);
  coursSheet['!cols'] = [
    { wch: 30 }, // Titre
    { wch: 20 }, // Matière
    { wch: 20 }, // Niveau
    { wch: 15 }, // Année
    { wch: 40 }, // Description
    { wch: 50 }, // Objectifs
  ];
  XLSX.utils.book_append_sheet(wb, coursSheet, 'Cours');

  // ===== SHEET 2: CHAPITRES =====
  const chapitresData = [
    {
      ChapitreID: 1,
      Titre: 'Introduction',
      Contenu: 'Bienvenue dans ce cours sur les transformations géométriques',
      Devoir: '',
      Ordre: 0,
    },
    {
      ChapitreID: 2,
      Titre: 'La Translation',
      Contenu: 'La translation est un déplacement sans rotation',
      Devoir: 'Tracer une translation',
      Ordre: 1,
    },
    {
      ChapitreID: 3,
      Titre: 'La Rotation',
      Contenu: 'La rotation est un déplacement autour d\'un point fixe',
      Devoir: 'Construire une rotation',
      Ordre: 2,
    },
  ];
  const chapitresSheet = XLSX.utils.json_to_sheet(chapitresData);
  chapitresSheet['!cols'] = [
    { wch: 12 }, // ChapitreID
    { wch: 25 }, // Titre
    { wch: 50 }, // Contenu
    { wch: 30 }, // Devoir
    { wch: 8 },  // Ordre
  ];
  XLSX.utils.book_append_sheet(wb, chapitresSheet, 'Chapitres');

  // ===== SHEET 3: SUPPORTS =====
  const supportsData = [
    {
      SupportID: 1,
      Type: 'VIDEO',
      ChapitreID: 2,
      URL_Contenu: 'https://youtube.com/watch?v=example1',
      Nom: '',
    },
    {
      SupportID: 2,
      Type: 'PDF',
      ChapitreID: 2,
      URL_Contenu: 'https://example.com/translation.pdf',
      Nom: '',
    },
    {
      SupportID: 3,
      Type: 'TEXTE',
      ChapitreID: 2,
      URL_Contenu: 'Voici les points clés à retenir',
      Nom: '',
    },
    {
      SupportID: 4,
      Type: 'FORUM',
      ChapitreID: 3,
      URL_Contenu: 'Partagez vos solutions de rotation',
      Nom: '',
    },
    {
      SupportID: 5,
      Type: 'IMAGE',
      ChapitreID: 3,
      URL_Contenu: 'https://example.com/rotation.png',
      Nom: '',
    },
  ];
  const supportsSheet = XLSX.utils.json_to_sheet(supportsData);
  supportsSheet['!cols'] = [
    { wch: 12 }, // SupportID
    { wch: 15 }, // Type
    { wch: 12 }, // ChapitreID
    { wch: 50 }, // URL_Contenu
    { wch: 20 }, // Nom
  ];
  XLSX.utils.book_append_sheet(wb, supportsSheet, 'Supports');

  // ===== SHEET 4: QUIZ FORMATIFS =====
  const quizFormatifs = [
    {
      QuizID: 1,
      ChapitreID: 2,
      Ordre: 1,
      Texte: 'Quel est le déplacement d\'une translation?',
      Type: 'QCM',
      Choix: 'Rotation,Glissement,Symétrie',
      Réponse: 'Glissement',
      Points: 1,
    },
    {
      QuizID: 2,
      ChapitreID: 2,
      Ordre: 2,
      Texte: 'La translation conserve-t-elle les angles?',
      Type: 'QCM',
      Choix: 'Oui,Non',
      Réponse: 'Oui',
      Points: 1,
    },
    {
      QuizID: 3,
      ChapitreID: 3,
      Ordre: 1,
      Texte: 'Quel est le point qui ne bouge pas lors d\'une rotation?',
      Type: 'QCM',
      Choix: 'Centre,Sommet,Arête',
      Réponse: 'Centre',
      Points: 1,
    },
  ];
  const quizFormatifsSheet = XLSX.utils.json_to_sheet(quizFormatifs);
  quizFormatifsSheet['!cols'] = [
    { wch: 10 }, // QuizID
    { wch: 12 }, // ChapitreID
    { wch: 8 },  // Ordre
    { wch: 50 }, // Texte
    { wch: 10 }, // Type
    { wch: 50 }, // Choix
    { wch: 20 }, // Réponse
    { wch: 8 },  // Points
  ];
  XLSX.utils.book_append_sheet(wb, quizFormatifsSheet, 'Quiz Formatifs');

  // ===== SHEET 5: QUIZ SOMMATIF =====
  const quizSommatif = [
    {
      QuestionID: 1,
      Ordre: 1,
      Texte: 'Quelle est la différence principale entre translation et rotation?',
      Type: 'QCM',
      Choix: 'Déplacement,Rotation,Symétrie',
      Réponse: 'Déplacement',
      Points: 1,
    },
    {
      QuestionID: 2,
      Ordre: 2,
      Texte: 'Ce cours vous a-t-il été utile?',
      Type: 'QCM',
      Choix: 'Oui,Non',
      Réponse: 'Oui',
      Points: 1,
    },
  ];
  const quizSommatifSheet = XLSX.utils.json_to_sheet(quizSommatif);
  quizSommatifSheet['!cols'] = [
    { wch: 15 }, // QuestionID
    { wch: 8 },  // Ordre
    { wch: 50 }, // Texte
    { wch: 10 }, // Type
    { wch: 50 }, // Choix
    { wch: 20 }, // Réponse
    { wch: 8 },  // Points
  ];
  XLSX.utils.book_append_sheet(wb, quizSommatifSheet, 'Quiz Sommatif');

  // Sauvegarder le fichier
  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Template Excel créé: ${outputPath}`);
}

module.exports = { generateExcelTemplate };