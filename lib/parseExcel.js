const XLSX = require('xlsx');

/**
 * Parse universel - accepte N'IMPORTE QUEL fichier Excel
 * Retourne toujours le même format
 */
async function parseExcelFile(filePath) {
  try {
    console.log('📊 Lecture du fichier Excel...');
    
    const workbook = XLSX.readFile(filePath);
    console.log('📋 Sheets disponibles:', workbook.SheetNames);
    
    // Chercher les sheets - case-insensitive
    const findSheet = (names) => {
      const wb_names = workbook.SheetNames.map(n => n.toLowerCase());
      for (const name of names) {
        const idx = wb_names.indexOf(name.toLowerCase());
        if (idx !== -1) return workbook.SheetNames[idx];
      }
      return null;
    };
    
    // Extraire chaque type de contenu
    const chapitresName = findSheet(['Chapitres', 'Chapters', 'Chapter']);
    const pretestName = findSheet(['Pretest', 'Pre-test', 'Pre test']);
    const formativeName = findSheet(['Quiz Formatifs', 'Quiz Formatif', 'Quiz formatif', 'Formatifs']);
    const sommatifName = findSheet(['Quiz Sommatif', 'Quiz sommatif', 'Sommatif', 'Test sommatif']);
    
    const chapitres = chapitresName ? extractSheet(workbook, chapitresName) : [];
    const pretest = pretestName ? extractSheet(workbook, pretestName) : [];
    const quizFormatifs = formativeName ? extractSheet(workbook, formativeName) : [];
    const quizSommatif = sommatifName ? extractSheet(workbook, sommatifName) : [];
    
    console.log(`
      ✅ Parse complet:
      - Chapitres: ${chapitres.length} lignes
      - Pretest: ${pretest.length} lignes
      - Quiz Formatifs: ${quizFormatifs.length} lignes
      - Quiz Sommatif: ${quizSommatif.length} lignes
    `);
    
    return {
      chapitres,
      pretest,
      quizFormatifs,
      quizSommatif,
    };
  } catch (error) {
    console.error('❌ Erreur parse Excel:', error);
    throw new Error(`Erreur lecture Excel: ${error.message}`);
  }
}

/**
 * Extraire une sheet du workbook
 */
function extractSheet(workbook, sheetName) {
  try {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`  📄 Sheet "${sheetName}": ${data.length} lignes`);
    return data || [];
  } catch (error) {
    console.warn(`  ⚠️ Erreur extraction "${sheetName}":`, error.message);
    return [];
  }
}

/**
 * Valider les données chapitres
 */
function validateChapitres(chapitres) {
  const errors = [];
  
  if (!Array.isArray(chapitres) || chapitres.length === 0) {
    return { valid: true, errors: [] }; // OK si vide
  }
  
  chapitres.forEach((ch, idx) => {
    if (!ch.ChapitreID && !ch['Chapitre ID']) {
      errors.push(`Chapitre ligne ${idx + 1}: manque ChapitreID`);
    }
    if (!ch.Titre && !ch['Titre du chapitre']) {
      errors.push(`Chapitre ligne ${idx + 1}: manque Titre`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Valider les données quiz
 */
function validateQuestions(questions) {
  const errors = [];
  
  if (!Array.isArray(questions) || questions.length === 0) {
    return { valid: true, errors: [] }; // OK si vide
  }
  
  questions.forEach((q, idx) => {
    if (!q.Texte && !q['Question']) {
      errors.push(`Question ligne ${idx + 1}: manque Texte/Question`);
    }
    if (!q.Type) {
      errors.push(`Question ligne ${idx + 1}: manque Type`);
    }
    // Choix optionnels pour OUVERTE
    if (q.Type !== 'OUVERTE' && !q.Choix && !q['Réponses']) {
      errors.push(`Question ligne ${idx + 1}: manque Choix (requis sauf pour OUVERTE)`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Normaliser les données (unifier les noms de colonnes)
 */
function normalizeQuestion(q) {
  return {
    id: q.QuestionID || q.ID || null,
    ordre: q.Ordre || q['N°'] || null,
    texte: q.Texte || q.Question || q['Énoncé'] || '',
    type: (q.Type || '').toUpperCase(),
    choix: parseChoix(q.Choix || q['Réponses'] || q['Options'] || ''),
    reponse: String(q.Réponse || q['Bonne réponse'] || q.Correcte || ''),
    points: q.Points || 1,
  };
}

/**
 * Parser les choix avec séparateurs multiples
 */
function parseChoix(choixStr) {
  if (!choixStr) return [];
  return String(choixStr)
    .split(/[,;|]/)
    .map(c => c.trim())
    .filter(c => c.length > 0);
}

module.exports = {
  parseExcelFile,
  validateChapitres,
  validateQuestions,
  normalizeQuestion,
  parseChoix,
};
