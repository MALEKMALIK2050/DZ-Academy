const mammoth = require('mammoth');
const fs = require('fs');

/**
 * Parse un fichier DOCX et extrait la structure pédagogique
 * VERSION 2 - Robuste avec gestion stricte des séparateurs
 */
async function parseDocxAdvanced(filePath) {
  try {
    const docxBuffer = fs.readFileSync(filePath);
    const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
    const text = htmlToText(html);
    
    console.log('📄 Texte brut extrait (premiers 500 chars):');
    console.log(text.substring(0, 500));
    console.log('---');
    
    const structure = parseStructure(text);
    return structure;
  } catch (error) {
    console.error('Erreur parse DOCX:', error);
    throw new Error(`Erreur lecture DOCX: ${error.message}`);
  }
}

function htmlToText(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function parseStructure(text) {
  const structure = {
    metadata: extractMetadataStrict(text),
    chapters: extractChaptersStrict(text),
    quizSommatif: extractQuizSommatifStrict(text),
  };

  console.log('🔍 Métadonnées extraites:', structure.metadata);
  
  return structure;
}

/**
 * EXTRACTION STRICTE DES MÉTADONNÉES
 */
function extractMetadataStrict(text) {
  const metadata = {
    title: extractValueStrict(text, 'TITRE:') || 'Cours importé',
    matiere: extractValueStrict(text, 'MATIERE:') || 'Général',
    niveau: extractValueStrict(text, 'NIVEAU:') || 'Non spécifié',
    annee: extractValueStrict(text, 'ANNEE:') || 'Non spécifié',
    description: extractValueStrict(text, 'DESCRIPTION:') || 'Cours créé par import',
    objectifs: extractArrayStrict(text, 'OBJECTIFS:') || ['Apprentissage du contenu'],
  };

  return metadata;
}

/**
 * Extraire une valeur STRICTE après une clé
 * Cherche jusqu'au prochain bloc majuscule
 */
function extractValueStrict(text, key) {
  // Chercher la clé exacte
  const keyIndex = text.indexOf(key);
  if (keyIndex === -1) {
    console.warn(`⚠️ Clé non trouvée: ${key}`);
    return '';
  }

  // Commencer après la clé
  let startIndex = keyIndex + key.length;
  
  // Sauter les espaces et nouvelles lignes
  while (startIndex < text.length && /[\s]/.test(text[startIndex])) {
    startIndex++;
  }

  // Chercher le prochain bloc majuscule (nouvelle clé)
  let endIndex = startIndex;
  const blocPattern = /\n[A-Z_]+:/;
  const match = text.substring(startIndex).match(blocPattern);
  
  if (match) {
    endIndex = startIndex + match.index;
  } else {
    endIndex = text.length;
  }

  const value = text.substring(startIndex, endIndex).trim();
  console.log(`✅ ${key} → "${value.substring(0, 50)}..."`);
  
  return value;
}

/**
 * Extraire un ARRAY STRICT (lignes commençant par -)
 */
function extractArrayStrict(text, key) {
  const keyIndex = text.indexOf(key);
  if (keyIndex === -1) {
    return [];
  }

  let startIndex = keyIndex + key.length;
  
  // Sauter espaceurs
  while (startIndex < text.length && /[\s]/.test(text[startIndex])) {
    startIndex++;
  }

  // Chercher prochain bloc majuscule
  let endIndex = startIndex;
  const blocPattern = /\n[A-Z_]+:/;
  const match = text.substring(startIndex).match(blocPattern);
  
  if (match) {
    endIndex = startIndex + match.index;
  } else {
    endIndex = text.length;
  }

  const section = text.substring(startIndex, endIndex);
  
  // Parser les lignes commençant par -
  const items = section
    .split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((line) => line.length > 0);

  console.log(`✅ ${key} → ${items.length} items`);
  
  return items;
}

/**
 * EXTRACTION STRICTE DES CHAPITRES
 */
function extractChaptersStrict(text) {
  const chapters = [];
  
  // Chercher tous les "CHAPITRE:"
  const chapterPattern = /CHAPITRE:\s*([^\n]+)\n([\s\S]*?)(?=CHAPITRE:|QUIZ_SOMMATIF:|$)/g;
  let match;

  while ((match = chapterPattern.exec(text)) !== null) {
    const title = match[1].trim();
    const chapterContent = match[2];

    chapters.push({
      title: title || 'Chapitre sans titre',
      content: extractValueStrict(chapterContent, 'CONTENU:') || 'Contenu du chapitre',
      supports: parseSupportStrict(chapterContent),
      quiz: parseQuizFormatifStrict(chapterContent),
      devoir: extractValueStrict(chapterContent, 'DEVOIR:') || null,
    });
  }

  console.log(`✅ ${chapters.length} chapitres extraits`);
  
  return chapters;
}

/**
 * Parser les supports (strict)
 */
function parseSupportStrict(text) {
  const supports = [];
  const supportTypes = [
    { key: 'SUPPORT_VIDEO:', type: 'VIDEO' },
    { key: 'SUPPORT_PDF:', type: 'PDF' },
    { key: 'SUPPORT_IMAGE:', type: 'IMAGE' },
    { key: 'SUPPORT_SCORM:', type: 'SCORM' },
    { key: 'SUPPORT_ARTICULATE:', type: 'ARTICULATE' },
    { key: 'SUPPORT_FORUM:', type: 'FORUM' },
    { key: 'SUPPORT_PPT:', type: 'PPT' },
    { key: 'SUPPORT_TEXTE:', type: 'TEXTE' },
  ];

  supportTypes.forEach(({ key, type }) => {
    const values = extractArrayStrict(text, key);
    values.forEach((value) => {
      if (value) {
        supports.push({
          type,
          url: type === 'FORUM' || type === 'TEXTE' ? null : value,
          nom: type === 'FORUM' ? value : null,
          contenu: type === 'FORUM' || type === 'TEXTE' ? value : null,
        });
      }
    });
  });

  return supports;
}

/**
 * Parser un QUIZ_FORMATIF (strict)
 */
function parseQuizFormatifStrict(text) {
  const questions = [];
  
  // Chercher "QUIZ_FORMATIF:" suivi de questions
  const quizMatch = text.match(/QUIZ_FORMATIF:([\s\S]*?)(?=DEVOIR:|CHAPITRE:|SUPPORT_|QUIZ_SOMMATIF:|$)/);
  if (!quizMatch) {
    return null;
  }

  const quizContent = quizMatch[1];
  
  // Chercher toutes les "QUESTION:"
  const questionPattern = /QUESTION:\s*([^\n]+)\n([\s\S]*?)(?=QUESTION:|$)/g;
  let match;

  while ((match = questionPattern.exec(quizContent)) !== null) {
    const texte = match[1].trim();
    const qContent = match[2];

    const choix = extractArrayStrict(qContent, 'CHOIX:');
    const reponse = extractValueStrict(qContent, 'REPONSE:');

    if (texte && reponse) {
      questions.push({
        texte,
        choix: choix || [],
        reponse,
        type: 'QCM',
        points: 1,
      });
    }
  }

  return questions.length > 0 ? { type: 'FORMATIF', questions } : null;
}

/**
 * Parser le QUIZ_SOMMATIF (strict)
 */
function extractQuizSommatifStrict(text) {
  const quizMatch = text.match(/QUIZ_SOMMATIF:([\s\S]*?)$/);
  if (!quizMatch) {
    return null;
  }

  const quizContent = quizMatch[1];
  const questions = [];
  
  const questionPattern = /QUESTION:\s*([^\n]+)\n([\s\S]*?)(?=QUESTION:|$)/g;
  let match;

  while ((match = questionPattern.exec(quizContent)) !== null) {
    const texte = match[1].trim();
    const qContent = match[2];

    const choix = extractArrayStrict(qContent, 'CHOIX:');
    const reponse = extractValueStrict(qContent, 'REPONSE:');

    if (texte && reponse) {
      questions.push({
        texte,
        choix: choix || [],
        reponse,
        type: 'QCM',
        points: 1,
      });
    }
  }

  return questions.length > 0 ? { type: 'SOMMATIF', questions } : null;
}

module.exports = { parseDocxAdvanced, parseStructure };