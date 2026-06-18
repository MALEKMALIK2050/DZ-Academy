import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

// ----------------------------------------------------
// 🔐 AUTHENTIFICATION
// ----------------------------------------------------
function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

// ----------------------------------------------------
// 🎓 GESTION SCORM (NOUVEAU - ajouté au début)
// ----------------------------------------------------
async function handleScormImport(zip, manifestEntry, courseId, res) {
  console.log('🎓 Paquet SCORM détecté !');

  try {
    // 1. Parser le manifest
    const manifestContent = manifestEntry.getData().toString('utf8');

    const titleMatch = manifestContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const scormTitle = titleMatch ? titleMatch[1].trim() : 'Support SCORM';

    const hrefMatch = manifestContent.match(/<resource[^>]*type="webcontent"[^>]*href="([^"]+)"/i)
                   || manifestContent.match(/href="([^"]+\.html)"/i);
    const launchFile = hrefMatch ? hrefMatch[1] : 'index.html';

    const scormVersion = manifestContent.includes('2004') ? '2004' : '1.2';

    // 2. Déterminer le dossier racine du SCORM dans le ZIP
    const manifestPath = manifestEntry.entryName;
    const scormRootFolder = manifestPath.includes('/')
      ? manifestPath.substring(0, manifestPath.lastIndexOf('/') + 1)
      : '';

    console.log(`📂 Dossier racine : "${scormRootFolder || '(racine)'}"`);
    console.log(`🎯 Fichier de lancement : ${launchFile}`);

    // 3. Créer le dossier de destination
    const timestamp = Date.now();
    const storageFolder = `course-${courseId}-${timestamp}`;
    const uploadDir = path.join(process.cwd(), 'public', 'scorm', storageFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    // 4. Extraire tous les fichiers du SCORM
    let extractCount = 0;
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName;
      if (entryName.includes('__MACOSX')) continue;
      if (entryName.split('/').pop().startsWith('._')) continue;
      if (scormRootFolder && !entryName.startsWith(scormRootFolder)) continue;

      const relativePath = scormRootFolder
        ? entryName.substring(scormRootFolder.length)
        : entryName;
      if (!relativePath) continue;

      const filePath = path.join(uploadDir, relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, entry.getData());
      extractCount++;
    }

    console.log(`📤 ${extractCount} fichiers extraits`);

    // 5. Créer l'enregistrement en base
    const scormPackage = await prisma.scormPackage.create({
      data: {
        courseId,
        title: scormTitle,
        version: scormVersion,
        launchFile,
        storagePath: storageFolder,
      },
    });

    console.log(`✅ SCORM créé en base : id=${scormPackage.id}`);

    return res.status(200).json({
      success: true,
      message: '✅ SCORM importé avec succès',
      stats: { supports: 1, chapters: 0, pretest: 0, quizzes: 0, sommatif: 0, devoirs: 0 },
      scorm: {
        id: scormPackage.id,
        title: scormTitle,
        version: scormVersion,
        launchFile,
        storagePath: storageFolder,
        filesExtracted: extractCount
      }
    });

  } catch (error) {
    console.error('❌ ERREUR IMPORT SCORM:', error);
    return res.status(500).json({ error: `Erreur SCORM: ${error.message}` });
  }
}

// ----------------------------------------------------
// 🚀 HANDLER PRINCIPAL
// ----------------------------------------------------
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
    console.log('📦 Tri et ordonnancement de l\'import ZIP...');
    const courseInt = parseInt(courseId);
    const course = await prisma.course.findUnique({ where: { id: courseInt } });
    if (!course) {
      return res.status(404).json({ error: `Cours ${courseInt} non trouvé` });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const zip = new AdmZip(buffer);

    // ====================================================
    // 🎯 DÉTECTION SCORM (EN PREMIER - avant tout le reste)
    // ====================================================
    const manifestEntry = zip.getEntries().find(e =>
      !e.isDirectory &&
      e.entryName.toLowerCase().endsWith('imsmanifest.xml') &&
      !e.entryName.includes('__MACOSX')
    );

    if (manifestEntry) {
      console.log('🎓 imsmanifest.xml trouvé → traitement SCORM');
      return await handleScormImport(zip, manifestEntry, courseInt, res);
    }

    // ====================================================
    // 📊 SINON → IMPORT EXCEL (ton code existant conservé)
    // ====================================================
    const XLSX = await import('xlsx');

    let stats = {
      pretest: 0,
      chapters: 0,
      supports: 0,
      quizzes: 0,
      sommatif: 0,
      devoirs: 0,
    };

    let pretestEntry = null;
    let chaptersEntry = null;
    let formativeQuizEntry = null;
    let summativeQuizEntry = null;
    let supportsEntry = null;
    let devoirsEntry = null;

    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName.toLowerCase();
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
        formativeQuizEntry = entry;
      } else if (entryName.includes('support')) {
        supportsEntry = entry;
      } else if (entryName.includes('devoir')) {
        devoirsEntry = entry;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE A : IMPORT DES CHAPITRES
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
            data: { courseId: courseInt, ordre, title: titre, content: contenu },
          });
        }
        stats.chapters++;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE B : IMPORT DU PRETEST
    // ----------------------------------------------------
    if (pretestEntry) {
      console.log('📋 Importation du Pretest...');
      const fileData = pretestEntry.getData();

      const existingPretest = await prisma.pretest.findFirst({
        where: { courseId: courseInt },
      });
      if (existingPretest) {
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
                row['Option1'] || '', row['Option2'] || '',
                row['Option3'] || '', row['Option4'] || '',
              ].filter(o => o),
              reponse: row['Réponse'] || row['Reponse'] || '',
            },
          });
          stats.pretest++;
        }
      }
    }

    // ----------------------------------------------------
    // ÉTAPE C : IMPORT DES QUIZZES FORMATIFS
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
            where: { courseId: courseInt, title: { equals: chapitreTitle, mode: 'insensitive' } }
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
              row['Option1'] || '', row['Option2'] || '',
              row['Option3'] || '', row['Option4'] || '',
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
    // ÉTAPE D : IMPORT DU QUIZ SOMMATIF
    // ----------------------------------------------------
    if (summativeQuizEntry) {
      console.log('🏆 Importation du Quiz Sommatif...');
      const fileData = summativeQuizEntry.getData();
      const workbook = XLSX.read(fileData, { type: 'buffer' });
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
          data: { quizId: quiz.id, texte, choix, reponse, points, type: 'QCM' },
        });
        stats.sommatif++;
      }
    }

    // ----------------------------------------------------
    // ÉTAPE E : IMPORT DES SUPPORTS
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
            where: { courseId: courseInt, title: { equals: chapitreTitle, mode: 'insensitive' } }
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
    // ÉTAPE F : IMPORT DES DEVOIRS
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
            where: { courseId: courseInt, title: { equals: chapitreTitle, mode: 'insensitive' } }
          });
          if (ch) chapterId = ch.id;
        }
        if (!chapterId) continue;

        const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
        if (!chapter) continue;

        const chapterDate = new Date(chapter.createdAt);
        const dateLimit = new Date(chapterDate.getTime() + 3 * 24 * 60 * 60 * 1000);

        await prisma.devoir.create({
          data: { chapterId, titre, consigne: description, dateLimit },
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