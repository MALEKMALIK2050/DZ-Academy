/**
 * Constructeur de structure de cours - VERSION FAKE/LOCAL
 * Transforme les données parsées en JSON structuré pour la BD
 */

function buildCourseStructure(parsedData) {
  const metadata = validateMetadata(parsedData.metadata || {});
  const chapters = (parsedData.chapters || []).map((chapter, index) =>
    buildChapter(chapter, index)
  );
  const quizSommatif = buildQuizSommatif(parsedData.quizSommatif);

  const structure = {
    title: metadata.title,
    matiere: metadata.matiere,
    niveau: metadata.niveau,
    annee: metadata.annee,
    description: metadata.description,
    objectifs: metadata.objectifs,
    chapters,
    quizSommatif,
    metadata: {
      totalChapters: chapters.length,
      totalSupports: chapters.reduce((sum, ch) => sum + (ch.supports?.length || 0), 0),
      totalQuizFormatif: chapters.reduce((sum, ch) => sum + (ch.quiz?.questions?.length || 0), 0),
      hasQuizSommatif: !!quizSommatif,
      totalDevoirs: chapters.filter((ch) => ch.devoir).length,
      buildDate: new Date().toISOString(),
    },
  };

  return structure;
}

function validateMetadata(metadata) {
  return {
    title: (metadata.title || 'Sans titre').trim(),
    matiere: (metadata.matiere || 'Général').trim(),
    niveau: (metadata.niveau || 'Non spécifié').trim(),
    annee: (metadata.annee || new Date().getFullYear().toString()).trim(),
    description: (metadata.description || 'Cours créé par import').trim(),
    objectifs: Array.isArray(metadata.objectifs)
      ? metadata.objectifs.filter((o) => o && o.trim())
      : ['Apprentissage du contenu'],
  };
}

function buildChapter(chapterData, order) {
  return {
    title: (chapterData.title || `Chapitre ${order + 1}`).trim(),
    content: (chapterData.content || '').trim(),
    ordre: order,
    supports: buildSupports(chapterData.supports || []),
    quiz: buildQuizFormatif(chapterData.quiz),
    devoir: buildDevoir(chapterData.devoir, order),
    metadata: {
      supportCount: (chapterData.supports || []).length,
      hasQuiz: !!chapterData.quiz,
      hasDevoir: !!chapterData.devoir,
    },
  };
}

function buildSupports(supportsData) {
  if (!Array.isArray(supportsData) || supportsData.length === 0) {
    return [];
  }

  return supportsData
    .filter((support) => support && support.type)
    .map((support, index) => ({
      type: support.type,
      url: support.type === 'FORUM' ? null : support.url || null,
      nom: support.type === 'FORUM' ? support.nom : null,
      contenu: support.type === 'FORUM' ? support.contenu : null,
      ordre: index,
    }));
}

function buildQuizFormatif(quizData) {
  if (!quizData || !Array.isArray(quizData.questions)) {
    return null;
  }

  const questions = quizData.questions
    .filter((q) => q.texte && q.reponse)
    .map((question, index) => ({
      type: question.type || 'QCM',
      texte: question.texte.trim(),
      choix: Array.isArray(question.choix)
        ? question.choix.filter((c) => c && c.trim())
        : [],
      reponse: question.reponse.trim(),
      points: question.points || 1,
      ordre: index,
    }));

  if (questions.length === 0) {
    return null;
  }

  return {
    type: 'FORMATIF',
    questions,
    totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
  };
}

function buildQuizSommatif(quizData) {
  if (!quizData || !Array.isArray(quizData.questions)) {
    return null;
  }

  const questions = quizData.questions
    .filter((q) => q.texte && q.reponse)
    .map((question, index) => ({
      type: question.type || 'QCM',
      texte: question.texte.trim(),
      choix: Array.isArray(question.choix)
        ? question.choix.filter((c) => c && c.trim())
        : [],
      reponse: question.reponse.trim(),
      points: question.points || 1,
      ordre: index,
    }));

  if (questions.length === 0) {
    return null;
  }

  return {
    type: 'SOMMATIF',
    questions,
    totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
  };
}

function buildDevoir(devoirData, chapterOrder) {
  if (!devoirData || devoirData.trim().length === 0) {
    return null;
  }

  return {
    titre: `Devoir - Chapitre ${chapterOrder + 1}`,
    consigne: devoirData.trim(),
    dateLimit: null,
  };
}

function validateCourseStructure(structure) {
  const errors = [];

  if (!structure.title || structure.title.trim().length === 0) {
    errors.push('Le titre du cours est obligatoire');
  }

  if (!Array.isArray(structure.chapters) || structure.chapters.length === 0) {
    errors.push('Au moins un chapitre est requis');
  }

  structure.chapters.forEach((chapter, index) => {
    if (!chapter.title || chapter.title.trim().length === 0) {
      errors.push(`Chapitre ${index + 1}: titre obligatoire`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

function transformForDatabase(structure, designerId) {
  return {
    course: {
      title: structure.title,
      description: structure.description,
      objectifs: structure.objectifs.join('|'),
      designerId,
      matiere: structure.matiere,
      niveau: structure.niveau,
      annee: structure.annee,
      status: 'DRAFT',
    },

    chapters: structure.chapters.map((chapter) => ({
      title: chapter.title,
      content: chapter.content,
      ordre: chapter.ordre,
      objectifs: null,
      supports: chapter.supports,
      quizFormatif: chapter.quiz,
      devoir: chapter.devoir,
    })),

    quizSommatif: structure.quizSommatif,
  };
}

module.exports = {
  buildCourseStructure,
  validateCourseStructure,
  transformForDatabase,
  buildChapter,
  buildSupports,
  buildQuizFormatif,
  buildQuizSommatif,
  buildDevoir,
};