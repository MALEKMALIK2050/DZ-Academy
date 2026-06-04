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

    return parseStructure(normalized);
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
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

function extractBlock(text, key) {
  const index = text.toLowerCase().indexOf(key.toLowerCase());
  if (index === -1) return '';

  const start = index + key.length;
  let end = text.length;

  for (const stop of STOP_KEYS) {
    const stopIndex = text.toLowerCase().indexOf(stop.toLowerCase(), start);
    if (stopIndex !== -1 && stopIndex < end) end = stopIndex;
  }

  return text.substring(start, end).trim();
}

function cleanTitle(raw) {
  return (raw || '')
    .split('CONTENU:')[0]
    .split('SUPPORT_')[0]
    .split('QUIZ_')[0]
    .split('DEVOIR:')[0]
    .trim();
}

function cleanContent(text) {
  return (text || '')
    .replace(/SUPPORT_[A-Z_]+:/g, '')
    .replace(/QUIZ_[A-Z_]+:/g, '')
    .replace(/DEVOIR:/g, '')
    .trim();
}

function parseStructure(text) {
  const chapters = [];
  const parts = text.split(/CHAPITRE:\s*/i);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lines = part.split('\n');

    const title = cleanTitle(lines[0]) || `Chapitre ${i}`;

    const content = cleanContent(extractBlock(part, 'CONTENU:'));

    const supports = extractSupports(part);
    const quiz = extractQuiz(part, 'quiz_formatif:');
    const devoir = extractDevoir(part);

    chapters.push({
      title,
      content,
      supports,
      quiz,
      devoir
    });
  }

  return {
    chapters,
    quizSommatif: extractQuizSommatif(text)
  };
}

function extractSupports(text) {
  const supports = [];

  const map = [
    { key: 'SUPPORT_VIDEO:', type: 'VIDEO' },
    { key: 'SUPPORT_PDF:', type: 'PDF' },
    { key: 'SUPPORT_IMAGE:', type: 'IMAGE' }
  ];

  for (const { key, type } of map) {
    const block = extractBlock(text, key);

    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) =>
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
        contenu: value.includes('http') ? null : value
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
    questions
  };
}

function extractQuizSommatif(text) {
  const block = extractBlock(text, 'quiz_sommatif:');
  const questions = extractQuestions(block);

  if (!questions.length) return null;

  return {
    type: 'SOMMATIF',
    questions
  };
}

function extractQuestions(text) {
  const questions = [];
  const parts = text.split(/QUESTION:\s*/i);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lines = part.split('\n');

    const texte = (lines[0] || '').trim();
    if (!texte) continue;

    const choixIndex = part.toLowerCase().indexOf('choix:');
    let choix = [];

    if (choixIndex !== -1) {
      const start = choixIndex + 6;
      const end = part.toLowerCase().indexOf('reponse:', start);
      const finalEnd = end === -1 ? part.length : end;

      const section = part.substring(start, finalEnd);

      choix = section
        .split('\n')
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter((l) => l && !l.includes('CHOIX') && !l.includes('REPONSE'));
    }

    const repIndex = part.toLowerCase().indexOf('reponse:');
    let reponse = '';

    if (repIndex !== -1) {
      reponse = part.substring(repIndex + 8).trim();
    }

    if (texte && reponse) {
      questions.push({
        texte,
        choix: choix.length ? choix : ['Oui', 'Non'],
        reponse,
        type: 'QCM',
        points: 1
      });
    }
  }

  return questions;
}

function extractDevoir(text) {
  const block = extractBlock(text, 'devoir:');
  return cleanContent(block);
}

module.exports = { parseDocxSimplified };