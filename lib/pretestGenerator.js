/**
 * Générer 15-20 questions pretest à partir des données du cours
 */

async function generatePretest(courseData, chapitresData, supportsData) {
  const questions = [];

  // Q1: Titre du cours
  if (courseData?.Titre) {
    questions.push({
      type: 'QCM',
      texte: `Quel est le titre de ce cours?`,
      choix: [courseData.Titre, 'Autre cours 1', 'Autre cours 2', 'Autre cours 3'],
      reponse: courseData.Titre,
      points: 1,
    });
  }

  // Questions sur les chapitres
  if (Array.isArray(chapitresData) && chapitresData.length > 0) {
    for (const chap of chapitresData) {
      if (!chap.Titre) continue;

      questions.push({
        type: 'QCM',
        texte: `Un des chapitres de ce cours est intitulé?`,
        choix: [chap.Titre, 'Introduction', 'Conclusion', 'Résumé'],
        reponse: chap.Titre,
        points: 1,
      });

      if (chap.Devoir) {
        questions.push({
          type: 'VRAI_FAUX',
          texte: `Le chapitre "${chap.Titre}" contient un devoir?`,
          choix: ['Vrai', 'Faux'],
          reponse: 'Vrai',
          points: 1,
        });
      }
    }
  }

  // Questions sur les supports
  if (Array.isArray(supportsData) && supportsData.length > 0) {
    const types = [...new Set(supportsData.map(s => s.Type))];
    
    if (types.includes('VIDEO')) {
      questions.push({
        type: 'VRAI_FAUX',
        texte: 'Ce cours contient des vidéos?',
        choix: ['Vrai', 'Faux'],
        reponse: 'Vrai',
        points: 1,
      });
    }

    if (types.includes('PDF')) {
      questions.push({
        type: 'VRAI_FAUX',
        texte: 'Vous aurez accès à des documents PDF?',
        choix: ['Vrai', 'Faux'],
        reponse: 'Vrai',
        points: 1,
      });
    }

    if (types.includes('FORUM')) {
      questions.push({
        type: 'VRAI_FAUX',
        texte: 'Vous pourrez discuter sur un forum?',
        choix: ['Vrai', 'Faux'],
        reponse: 'Vrai',
        points: 1,
      });
    }

    questions.push({
      type: 'QCM',
      texte: `Combien de types de ressources différentes?`,
      choix: [types.length.toString(), '1', '2', '5'],
      reponse: types.length.toString(),
      points: 1,
    });
  }

  // Limiter à 20
  return questions.slice(0, 20);
}

/**
 * Obtenir l'année précédente
 */
function getPreviousYear(year) {
  if (!year) return null;
  
  const yearMap = {
    '6eme': null,
    '5eme': '6eme',
    '4eme': '5eme',
    '3eme': '4eme',
    '1AS': '3eme',
    '2AS': '1AS',
    'Terminale': '2AS',
    '4ème': '5ème',
    '5ème': '6ème',
  };
  return yearMap[year.toLowerCase().trim()] || year;
}

/**
 * Créer le pretest en BD
 */
async function createPretestInDb(courseId, questions, prisma) {
  const pretest = await prisma.pretest.create({
    data: {
      courseId: courseId,
      questions: {
        create: questions.map(q => ({
          type: q.type,
          texte: q.texte,
          choix: q.choix,
          reponse: q.reponse,
          points: q.points,
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  return pretest;
}

/**
 * Obtenir le feedback par score
 */
function getFeedbackByScore(score, total, courseYear) {
  let percentage = 0;
  if (total && total > 0) {
    percentage = score > total ? score : (score / total) * 100;
  } else {
    percentage = score || 0;
  }
  percentage = Math.round(percentage);

  const previousYear = getPreviousYear(courseYear);

  // < 20%
  if (percentage < 20) {
    return {
      level: 'critique',
      color: 'red',
      message: 'مُحاولة طَيّبة! يُستحسن أن تراجع الأساسيات والمكتسبات في دروس السنوات السابقة لتتمكن من متابعة هذا الدرس بتمكن.',
      canContinue: true,
      mustRetakePretest: true,
      suggestedCourseYear: null,
    };
  }

  // 20% à 50%
  if (percentage <= 50) {
    return {
      level: 'faible',
      color: 'orange',
      message: 'أنت مستعد لمتابعة هذه الدورة بنجاح! أحسنت وبالتوفيق!',
      canContinue: true,
      mustRetakePretest: false,
    };
  }

  // > 50% à 90%
  if (percentage <= 90) {
    return {
      level: 'bon',
      color: 'green',
      message: 'أحسنت! إنك جاهز ومستعد تماماً لمتابعة هذا الدرس واستيعابه بنجاح باهر!',
      canContinue: true,
      mustRetakePretest: false,
    };
  }

  // > 90%
  return {
    level: 'excellent',
    color: 'emerald',
    message: 'إنك ممتاز! أداء فائق ورائع، أسرع الآن لإكمال هذا الدرس وتعلم المزيد - بالتوفيق!',
    canContinue: true,
    mustRetakePretest: false,
  };
}

async function generatePretestQuestions(courseStructure) {
  const courseData = { Titre: courseStructure.title };
  const chapitresData = (courseStructure.chapters || []).map(ch => ({
    Titre: ch.title,
    Devoir: ch.devoir ? 'Oui' : null
  }));
  const supportsData = [];
  if (courseStructure.chapters) {
    for (const ch of courseStructure.chapters) {
      if (ch.supports) {
        for (const sup of ch.supports) {
          supportsData.push({ Type: sup.type });
        }
      }
    }
  }
  return generatePretest(courseData, chapitresData, supportsData);
}

module.exports = { generatePretest, createPretestInDb, getFeedbackByScore, getPreviousYear, generatePretestQuestions };