const mammoth = require('mammoth');
const fs = require('fs');

const STOP_KEYS = [
  'CONTENU:',
  'SUPPORT_VIDEO:',
  'SUPPORT_PDF:',
  'SUPPORT_IMAGE:',
  'SUPPORT_SCORM:',
  'SUPPORT_ARTICULATE:',
  'SUPPORT_FORUM:',
  'SUPPORT_PPT:',
  'SUPPORT_TEXTE:',
  'QUIZ_FORMATIF:',
  'QUIZ_SOMMATIF:',
  'DEVOIR:'
];

async function parseDocxSimplified(filePath) {
  try {
    const docxBuffer = fs.readFileSync(filePath);
    const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
    const text = htmlToText(html);

    const normalized = text
      .replace(/QUESTION:/g, '\nQUESTION:')
      .replace(/CHOIX:/g, '\nCHOIX:')
      .replace(/REPONSE:/g, '\nREPONSE:');

    const structure = parseStructure(normalized);

    return structure;
  } catch (error) {
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

function extractBlock(text, key) {
  const index = text.toLowerCase().indexOf(key.toLowerCase());
  if (index === -1) return '';

  const start = index + key.length;
  let end = text.length;

  for (const stop of STOP_KEYS) {
    const stopIndex = text.toLowerCase().indexOf(stop.toLowerCase(), start);
    if (stopIndex !== -1 && stopIndex < end) {
      end = stopIndex;
    }
  }

  return text.substring(start, end).trim();
}

function parseStructure(text) {
  const chapters = [];
  const parts = text.split(/CHAPITRE:\s*/i);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lines = part.split('\n');

    const title = lines[0]?.trim() || `Chapitre ${i}`;

    const content = extractBlock(part, 'CONTENU:');
    const supports = extractSupports(part);
    const quiz = extractQuiz(part, 'quiz_formatif:');
    const devoir = extractDevoir(part);

    chapters.push({
      title,
      content: content || '',
      supports,
      quiz,
      devoir,
    });
  }

  const quizSommatif = extractQuizSommatif(text);

  return {
    chapters,
    quizSommatif,
  };
}

function extractSupports(text) {
  const supports = [];

  const map = [
    { key: 'SUPPORT_VIDEO:', type: 'VIDEO' },
    { key: 'SUPPORT_PDF:', type: 'PDF' },
    { key: 'SUPPORT_IMAGE:', type: 'IMAGE' },
    { key: 'SUPPORT_SCORM:', type: 'SCORM' },
    { key: 'SUPPORT_ARTICULATE:', type: 'ARTICULATE' },
    { key: 'SUPPORT_FORUM:', type: 'FORUM' },
    { key: 'SUPPORT_PPT:', type: 'PPT' },
    { key: 'SUPPORT_TEXTE:', type: 'TEXTE' },
  ];

  for (const { key, type } of map) {
    const block = extractBlock(text, key);

    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(l =>
        l &&
        !l.includes('SUPPORT_') &&
        !l.includes('QUIZ_') &&
        !l.includes('DEVOIR:')
      );

    for (const value of lines) {
      supports.push({
        type,
        url: value.includes('http') ? value : null,
        nom: value.includes('http') ? null : value,
        contenu: value.includes('http') ? null : value,
      });
    }
  }

  return supports;
}

function extractQuiz(text, key = 'quiz_formatif:') {
  const block = extractBlock(text, key);
  const questions = extractQuestions(block);

  if (!questions.length) return null;

  return {
    type: 'FORMATIF',
    questions,
  };
}

function extractQuizSommatif(text) {
  const block = extractBlock(text, 'quiz_sommatif:');
  const questions = extractQuestions(block);

  if (!questions.length) return null;

  return {
    type: 'SOMMATIF',
    questions,
  };
}

function extractQuestions(text) {
  const questions = [];
  const parts = text.split(/QUESTION:\s*/i);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lines = part.split('\n');

    const texte = lines[0]?.trim();
    if (!texte) continue;

    const choixIndex = part.toLowerCase().indexOf('choix:');
    let choix = [];

    if (choixIndex !== -1) {
      const choixStart = choixIndex + 6;
      const choixEnd = part.toLowerCase().indexOf('reponse:', choixStart);
      const finalEnd = choixEnd === -1 ? part.length : choixEnd;

      const choixSection = part.substring(choixStart, finalEnd);

      choix = choixSection
        .split('\n')
        .map(l => l.replace(/^[-*]\s*/, '').trim())
        .filter(l => l.length > 0 && !l.match(/^[A-Z_]+:/));
    }

    const reponseIndex = part.toLowerCase().indexOf('reponse:');
    let reponse = '';

    if (reponseIndex !== -1) {
      const reponseStart = reponseIndex + 8;
      const reponseEnd = part.length;
      reponse = part.substring(reponseStart, reponseEnd).trim();
    }

    if (texte && reponse) {
      questions.push({
        texte,
        choix: choix.length ? choix : ['Oui', 'Non'],
        reponse,
        type: 'QCM',
        points: 1,
      });
    }
  }

  return questions;
}

function extractDevoir(text) {
  const block = extractBlock(text, 'devoir:');
  return block.length ? block : null;
}

module.exports = { parseDocxSimplified };