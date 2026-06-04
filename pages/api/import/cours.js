import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from 'fs';
import os from 'os';

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
    console.log('📚 Import Chapitres + Supports + Devoirs...');

    const courseInt = parseInt(courseId);
    const course = await prisma.course.findUnique({ where: { id: courseInt } });
    if (!course) {
      return res.status(404).json({ error: `Course ${courseInt} non trouvé` });
    }

    // Parser Excel
    const XLSX = await import('xlsx');
    const buffer = Buffer.from(fileBase64, 'base64');
    const tmpFile = `${os.tmpdir()}/import-${Date.now()}.xlsx`;
    
    fs.writeFileSync(tmpFile, buffer);
    const workbook = XLSX.readFile(tmpFile);
    fs.unlinkSync(tmpFile);

    console.log('📋 Sheet names:', Object.keys(workbook.Sheets));
    
    const chapitres = XLSX.utils.sheet_to_json(workbook.Sheets['Chapitres'] || {});
    const supports = XLSX.utils.sheet_to_json(workbook.Sheets['Supports'] || {});
    const quizzes = XLSX.utils.sheet_to_json(workbook.Sheets['Quiz Formatifs'] || {});
    const devoirs = XLSX.utils.sheet_to_json(workbook.Sheets['Devoirs'] || {});

    console.log(`📊 Parsed: ${chapitres.length} chapitres, ${supports.length} supports, ${quizzes.length} quiz, ${devoirs.length} devoirs`);
    if (chapitres.length > 0) console.log('📖 Chapitre 1:', chapitres[0]);
    if (supports.length > 0) console.log('📎 Support 1:', supports[0]);
    if (quizzes.length > 0) console.log('📋 Quiz 1:', quizzes[0]);
    if (devoirs.length > 0) console.log('📝 Devoir 1:', devoirs[0]);

    let stats = {
      chapitres: 0,
      supports: 0,
      quizzes: 0,
      devoirs: 0,
      errors: [],
    };

    // ===== 1. CHAPITRES =====
    console.log('📖 Création chapitres...');
    const chapitreMap = {};

    for (const row of chapitres) {
      try {
        const title = row['Titre'] || row['titre'] || '';
        const ordre = parseInt(row['Ordre'] || row['ordre'] || 0);
        const objectifs = row['Objectifs'] || row['objectifs'] || '';

        console.log(`📖 Processing: title="${title}", ordre=${ordre}, objectifs="${objectifs}"`);

        if (!title) {
          console.warn('⚠️ Titre vide, skip');
          continue;
        }

        const existing = await prisma.chapter.findFirst({
          where: { courseId: courseInt, title },
        });

        if (existing) {
          await prisma.chapter.update({
            where: { id: existing.id },
            data: { title, ordre, objectifs },
          });
          chapitreMap[title] = existing.id;
          console.log(`✏️ Chapitre updated: ${title} (ID: ${existing.id})`);
        } else {
          const ch = await prisma.chapter.create({
            data: {
              courseId: courseInt,
              title,
              ordre,
              objectifs,
            },
          });
          chapitreMap[title] = ch.id;
          console.log(`✅ Chapitre created: ${title} (ID: ${ch.id})`);
        }
        stats.chapitres++;
      } catch (err) {
        console.error(`❌ Chapitre error:`, err.message);
        stats.errors.push(`Chapitre: ${err.message}`);
      }
    }

    console.log('Chapitre map:', chapitreMap);

    // ===== 2. SUPPORTS =====
    console.log('📎 Création supports...');

    for (const row of supports) {
      try {
        const chapitreTitle = row['Chapitre'] || row['chapitre'] || row['ChapitreTitle'] || '';
        const type = (row['Type'] || row['type'] || 'TEXTE').toUpperCase();
        const nom = row['Nom'] || row['nom'] || '';
        const urlContenu = row['URL/Contenu'] || row['url'] || row['contenu'] || '';
        const ordre = parseInt(row['Ordre'] || row['ordre'] || 0);

        console.log(`📎 Processing support: chapitre="${chapitreTitle}", type=${type}, nom="${nom}"`);

        if (!chapitreTitle || !nom) {
          console.warn(`⚠️ Chapitre titre ou Nom manquant`);
          continue;
        }

        const chapter = await prisma.chapter.findFirst({ where: { courseId: courseInt, title: chapitreTitle } });
        const chapterId = chapter?.id;
        if (!chapter) {
          console.warn(`⚠️ Chapitre ${chapterId} non trouvé`);
          continue;
        }

        // Gérer les types de supports
        let supportData = {
          chapterId,
          type,
          nom,
          ordre,
        };

        switch (type) {
          case 'TEXTE':
            supportData.contenu = urlContenu; // Contenu texte direct
            break;

          case 'VIDEO':
            supportData.url = urlContenu;
            if (urlContenu.includes('youtube')) {
              const videoId = urlContenu.match(/(?:v=|\/videos\/|embed\/|youtu.be\/|\/v\/|watch\?v=)([^&\n?#]+)/)?.[1];
              supportData.videoId = videoId;
            }
            break;

          case 'PDF':
          case 'IMAGE':
          case 'PPT':
            supportData.url = urlContenu;
            break;

          case 'SCORM':
            supportData.url = `/uploads/scorm/${courseInt}/${nom}`;
            break;

          case 'FORUM':
            const forumId = parseInt(urlContenu);
            supportData.forumId = forumId;
            break;

          default:
            supportData.url = urlContenu;
        }

        const existing = await prisma.support.findFirst({
          where: { chapterId, nom },
        });

        if (existing) {
          await prisma.support.update({
            where: { id: existing.id },
            data: supportData,
          });
          console.log(`✏️ Support updated: ${nom}`);
        } else {
          await prisma.support.create({ data: supportData });
          console.log(`✅ Support created: ${nom}`);
        }

        stats.supports++;
      } catch (err) {
        console.error(`❌ Support error:`, err.message);
        stats.errors.push(`Support: ${err.message}`);
      }
    }

    // ===== 3. QUIZ FORMATIFS =====
    console.log('📋 Création quiz formatifs...');
    const quizzesByChapter = {};

    for (const row of quizzes) {
      try {
        const chapitreTitle = row['Chapitre'] || row['chapitre'] || '';
        const question = row['Question'] || row['question'] || '';
        const option1 = row['Option1'] || row['option1'] || '';
        const option2 = row['Option2'] || row['option2'] || '';
        const option3 = row['Option3'] || row['option3'] || '';
        const option4 = row['Option4'] || row['option4'] || '';
        const reponse = row['Réponse'] || row['reponse'] || '';
        const points = parseInt(row['Points'] || row['points'] || 1);

        console.log(`📋 Processing quiz: chapitre="${chapitreTitle}", question="${question}"`);

        if (!chapitreTitle || !question) {
          console.warn(`⚠️ Chapitre titre ou Question manquant`);
          continue;
        }

        const chapter = await prisma.chapter.findFirst({ where: { courseId: courseInt, title: chapitreTitle } });
        const chapterId = chapter?.id;

        if (!chapterId) {
          console.warn(`⚠️ Chapitre "${chapitreTitle}" non trouvé`);
          continue;
        }

        // Grouper les questions par chapitre
        if (!quizzesByChapter[chapterId]) {
          quizzesByChapter[chapterId] = [];
        }

        quizzesByChapter[chapterId].push({
          texte: question,
          choix: [option1, option2, option3, option4].filter(c => c),
          reponse,
          points,
        });

      } catch (err) {
        console.error(`❌ Quiz error:`, err.message);
        stats.errors.push(`Quiz: ${err.message}`);
      }
    }

    // Créer les Quiz Formatifs
    for (const [chapterId, questions] of Object.entries(quizzesByChapter)) {
      try {
        const chapterIdInt = parseInt(chapterId);
        
        // Vérifier si un quiz existe déjà
        let quiz = await prisma.quiz.findFirst({
          where: { chapterId: chapterIdInt }
        });

        if (!quiz) {
          quiz = await prisma.quiz.create({
            data: {
              chapterId: chapterIdInt,
              type: 'FORMATIF',
            }
          });
          console.log(`✅ Quiz FORMATIF created: Chapitre ${chapterIdInt}`);
        } else {
          console.log(`✏️ Quiz FORMATIF exists: ${quiz.id}`);
        }

        // Ajouter les questions
        for (const q of questions) {
          const existing = await prisma.question.findFirst({
            where: { quizId: quiz.id, texte: q.texte }
          });

          if (!existing) {
            await prisma.question.create({
              data: {
                quizId: quiz.id,
                texte: q.texte,
                choix: q.choix,
                reponse: q.reponse,
                points: q.points,
              }
            });
            console.log(`✅ Question created: ${q.texte.substring(0, 30)}...`);
          }
        }

        stats.quizzes++;
      } catch (err) {
        console.error(`❌ Quiz creation error:`, err.message);
        stats.errors.push(`Quiz création: ${err.message}`);
      }
    }

    // ===== 4. DEVOIRS =====
    console.log('📝 Création devoirs...');

    for (const row of devoirs) {
      try {
        const chapitreTitle = row['Chapitre'] || row['chapitre'] || row['ChapitreTitle'] || '';
        const titre = row['Titre'] || row['titre'] || '';
        const description = row['Description'] || row['description'] || '';
        const dateLimitInput = row['DateLimit'] || row['dateLimit'] || '';

        console.log(`📝 Processing devoir: chapitre="${chapitreTitle}", titre="${titre}"`);

        if (!chapitreTitle || !titre) {
          console.warn(`⚠️ Chapitre titre ou Titre manquant`);
          continue;
        }

        const chapter = await prisma.chapter.findFirst({ where: { courseId: courseInt, title: chapitreTitle } });
        const chapterId = chapter?.id;
        
        if (!chapterId) {
          console.warn(`⚠️ Chapitre "${chapitreTitle}" non trouvé`);
          continue;
        }

        // Calculer la date limite: date d'ouverture du chapitre + 3 jours
        let dateLimit;
        if (dateLimitInput) {
          // Utiliser la date fournie dans Excel
          dateLimit = new Date(dateLimitInput);
        } else {
          // Date d'ouverture du chapitre + 3 jours
          const chapterDate = new Date(chapter.createdAt);
          dateLimit = new Date(chapterDate.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 jours
          console.log(`📅 DateLimit auto: ${chapter.createdAt} + 3 jours = ${dateLimit}`);
        }

        const existing = await prisma.devoir.findFirst({
          where: { chapterId, titre },
        });

        if (existing) {
          await prisma.devoir.update({
            where: { id: existing.id },
            data: {
              titre,
              consigne: description,
              dateLimit,
            },
          });
          console.log(`✏️ Devoir updated: ${titre} (limit: ${dateLimit})`);
        } else {
          await prisma.devoir.create({
            data: {
              chapterId,
              titre,
              consigne: description,
              dateLimit,
            },
          });
          console.log(`✅ Devoir created: ${titre} (limit: ${dateLimit})`);
        }

        stats.devoirs++;
      } catch (err) {
        console.error(`❌ Devoir error:`, err.message);
        stats.errors.push(`Devoir: ${err.message}`);
      }
    }

    console.log(`✅ Import complété:`, stats);

    return res.status(200).json({
      success: true,
      message: '✅ Chapitres, supports et devoirs importés',
      stats,
    });

  } catch (error) {
    console.error('❌ ERREUR IMPORT:', error.message);
    return res.status(500).json({ error: error.message });
  }
}