import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import AdmZip from 'adm-zip';

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user || user.role !== 'DESIGNER') return res.status(401).json({ error: 'Non autorisé' });

  const { courseId } = req.query;
  const { fileBase64 } = req.body;

  if (!courseId || !fileBase64) {
    return res.status(400).json({ error: 'courseId et fileBase64 requis' });
  }

  try {
    console.log('📦 Tri et ordonnancement de l’import ZIP...');

    const courseInt = parseInt(courseId);
    const course = await prisma.course.findUnique({ where: { id: courseInt } });
    if (!course) {
      return res.status(404).json({ error: `Cours ${courseInt} non trouvé` });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const zip = new AdmZip(buffer);
    const XLSX = await import('xlsx');

    let stats = {
      pretest: 0,
      chapters: 0,
      supports: 0,
      quizzes: 0,      // formatifs
      sommatif: 0,     // sommatifs
      devoirs: 0,
    };

    // 1. Initialisation des variables pour stocker les fichiers trouvés
    let pretestEntry = null;
    let chaptersEntry = null;
    let formativeQuizEntry = null;
    let summativeQuizEntry = null;
    let supportsEntry = null;
    let devoirsEntry = null;

    // 2. Filtrage et catégorisation des entrées du ZIP (on ignore les fichiers fantômes de l'OS)
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      
      const entryName = entry.name.toLowerCase();
      // Ignorer les fichiers système (ex. macOS metadata)
      if (entryName.startsWith('._') || entry.entryName.includes('__MACOSX')) {
        continue;
      }

      if (entryName.includes('pretest')) {
        pretestEntry = entry;
      } else if (entryName.includes('chapter') || entryName.includes('chapitre')) {
        chaptersEntry = entry;
      } else if (entryName.includes('sommatif')) {
        summativeQuizEntry = entry;
      } else if (entryName.includes('quiz')) {
        // S'il contient "quiz" mais pas "sommatif", on le traite comme formatif
        formativeQuizEntry = entry;
      } else if (entryName.includes('support')) {
        supportsEntry = entry;
      } else if (entryName.includes('devoir')) {
        devoirsEntry = entry;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE A : IMPORT DES CHAPITRES (Nécessaire avant tout le reste)
    // ----------------------------------------------------
    if (chaptersEntry) {
      console.log('📖 Importation des chapitres...');
      const fileData = chaptersEntry.getData();
      const workbook = XLSX.read(fileData, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      for (const row of rows) {
        const titre = row['Titre'] || row['titre'] || '';
        const ordre = parseInt(row['Ordre'] || stats.chapters + 1);
        const contenu = row['Contenu'] || row['contenu'] || '';

        if (!titre) continue;

        const existing = await prisma.chapter.findFirst({
          where: { courseId: courseInt, ordre },
        });

        if (existing) {
          await prisma.chapter.update({
            where: { id: existing.id },
            data: { title: titre, content: contenu },
          });
        } else {
          await prisma.chapter.create({
            data: {
              courseId: courseInt,
              ordre,
              title: titre,
              content: contenu,
            },
          });
        }
        stats.chapters++;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE B : IMPORT DU PRETEST (Indépendant des chapitres)
    // ----------------------------------------------------
    if (pretestEntry) {
      console.log('📋 Importation du Pretest...');
      const fileData = pretestEntry.getData();
      
      const existingPretest = await prisma.pretest.findFirst({
        where: { courseId: courseInt },
      });
      if (existingPretest) {
        // Suppression sécurisée des anciennes questions pour éviter les conflits de clé
        await prisma.pretestQuestion.deleteMany({ where: { pretestId: existingPretest.id } });
        await prisma.pretest.delete({ where: { id: existingPretest.id } });
      }

      const workbook = XLSX.read(fileData, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (rows.length > 0) {
        const pretest = await prisma.pretest.create({
          data: { courseId: courseInt },
        });

        for (const row of rows) {
          const question = row['Question'] || '';
          if (!question) continue;

          await prisma.pretestQuestion.create({
            data: {
              pretestId: pretest.id,
              texte: question,
              choix: [
                row['Option1'] || '',
                row['Option2'] || '',
                row['Option3'] || '',
                row['Option4'] || '',
              ].filter(o => o),
              reponse: row['Réponse'] || row['Reponse'] || '',
            },
          });
          stats.pretest++;
        }
      }
    }

    // ----------------------------------------------------
    // ÉTAPE C : IMPORT DES QUIZZES FORMATIFS (Liés aux chapitres existants)
    // ----------------------------------------------------
    if (formativeQuizEntry) {
      console.log('📊 Importation des Quizzes Formatifs...');
      const fileData = formativeQuizEntry.getData();
      const workbook = XLSX.read(fileData, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      for (const row of rows) {
        let chapterId = parseInt(row['ChapitreID'] || 0);
        const chapitreTitle = (row['Chapitre'] || row['chapitre'] || row['ChapitreTitle'] || '').trim();
        const question = row['Question'] || '';

        if (!question) continue;

        if (!chapterId && chapitreTitle) {
          const ch = await prisma.chapter.findFirst({ 
            where: { 
              courseId: courseInt, 
              title: { equals: chapitreTitle, mode: 'insensitive' } 
            } 
          });
          if (ch) chapterId = ch.id;
        }

        if (!chapterId) continue;

        const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
        if (!chapter) continue;

        const quiz = await prisma.quiz.findFirst({
          where: { chapterId, type: 'FORMATIF' },
        }) || await prisma.quiz.create({
          data: { chapterId, type: 'FORMATIF' },
        });

        await prisma.question.create({
          data: {
            quizId: quiz.id,
            texte: question,
            choix: [
              row['Option1'] || '',
              row['Option2'] || '',
              row['Option3'] || '',
              row['Option4'] || '',
            ].filter(o => o),
            reponse: row['Réponse'] || row['Reponse'] || '',
            points: parseInt(row['Points'] || 1),
            type: 'QCM',
          },
        });
        stats.quizzes++;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE D : IMPORT DU QUIZ SOMMATIF (Directement lié au cours)
    // ----------------------------------------------------
    if (summativeQuizEntry) {
      console.log('🏆 Importation du Quiz Sommatif...');
      const fileData = summativeQuizEntry.getData();
      const workbook = XLSX.read(fileData, { type: 'buffer' });
      
      // Recherche de l'onglet "Quiz Sommatif" ou utilisation de la première feuille
      const targetSheetName = workbook.SheetNames.find(n => n.includes('Sommatif')) || workbook.SheetNames[0];
      const sheet = workbook.Sheets[targetSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      let quiz = await prisma.quiz.findFirst({
        where: { courseId: courseInt, type: 'SOMMATIF' }
      });

      if (quiz) {
        await prisma.question.deleteMany({ where: { quizId: quiz.id } });
      } else {
        quiz = await prisma.quiz.create({
          data: { courseId: courseInt, type: 'SOMMATIF' }
        });
      }

      for (const row of rows) {
        const texte = row['Question'] != null ? String(row['Question']).trim() : '';
        const reponse = row['Réponse'] != null ? String(row['Réponse']).trim() : '';
        const points = parseInt(row['Points'] || 1);

        if (!texte || !reponse) continue;

        // On prend en compte les options sous format séparé par virgule ou colonnes d'options
        let choix = [];
        if (row['Choix']) {
          choix = String(row['Choix']).split(',').map(c => c.trim()).filter(Boolean);
        } else {
          choix = [
            row['Option1'] != null ? String(row['Option1']).trim() : '',
            row['Option2'] != null ? String(row['Option2']).trim() : '',
            row['Option3'] != null ? String(row['Option3']).trim() : '',
            row['Option4'] != null ? String(row['Option4']).trim() : '',
          ].filter(Boolean);
        }

        await prisma.question.create({
          data: {
            quizId: quiz.id,
            texte,
            choix,
            reponse,
            points,
            type: 'QCM',
          },
        });
        stats.sommatif++;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE E : IMPORT DES SUPPORTS (Liés aux chapitres)
    // ----------------------------------------------------
    if (supportsEntry) {
      console.log('📎 Importation des supports...');
      const fileData = supportsEntry.getData();
      const workbook = XLSX.read(fileData, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      for (const row of rows) {
        let chapterId = parseInt(row['ChapitreID'] || 0);
        const chapitreTitle = (row['Chapitre'] || row['chapitre'] || row['ChapitreTitle'] || '').trim();
        const titre = row['Titre'] || row['titre'] || row['Nom'] || row['nom'] || '';

        if (!titre) continue;

        if (!chapterId && chapitreTitle) {
          const ch = await prisma.chapter.findFirst({ 
            where: { 
              courseId: courseInt, 
              title: { equals: chapitreTitle, mode: 'insensitive' } 
            } 
          });
          if (ch) chapterId = ch.id;
        }

        if (!chapterId) continue;

        await prisma.support.create({
          data: {
            chapterId,
            nom: titre,
            type: (row['Type'] || row['type'] || 'TEXTE').toUpperCase(),
            contenu: row['Contenu'] || row['contenu'] || '',
            url: row['URL'] || row['url'] || null,
          },
        });
        stats.supports++;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE F : IMPORT DES DEVOIRS (Liés aux chapitres)
    // ----------------------------------------------------
    if (devoirsEntry) {
      console.log('📝 Importation des devoirs...');
      const fileData = devoirsEntry.getData();
      const workbook = XLSX.read(fileData, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      for (const row of rows) {
        let chapterId = parseInt(row['ChapitreID'] || 0);
        const chapitreTitle = (row['Chapitre'] || row['chapitre'] || row['ChapitreTitle'] || '').trim();
        const titre = row['Titre'] || row['titre'] || '';
        const description = row['Description'] || row['description'] || '';

        if (!titre) continue;

        if (!chapterId && chapitreTitle) {
          const ch = await prisma.chapter.findFirst({ 
            where: { 
              courseId: courseInt, 
              title: { equals: chapitreTitle, mode: 'insensitive' } 
            } 
          });
          if (ch) chapterId = ch.id;
        }

        if (!chapterId) continue;

        const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
        if (!chapter) continue;

        const chapterDate = new Date(chapter.createdAt);
        const dateLimit = new Date(chapterDate.getTime() + 3 * 24 * 60 * 60 * 1000);

        await prisma.devoir.create({
          data: {
            chapterId,
            titre,
            consigne: description,
            dateLimit,
          },
        });
        stats.devoirs++;
      }
    }

    console.log('✅ Import ZIP complet réussi !', stats);

    return res.status(200).json({
      success: true,
      message: '✅ Cours importé avec succès',
      stats,
    });

  } catch (error) {
    console.error('❌ ERREUR LORS DE L\'IMPORTATION ZIP:', error);
    return res.status(500).json({ error: error.message });
  }
}