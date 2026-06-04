import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { parseExcelFile } from "@/lib/parseExcel";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { batchId, courseId, extractDir, modules } = req.body;

    if (!batchId || !courseId || !extractDir) {
      return res.status(400).json({ error: "batchId, courseId, extractDir obligatoires" });
    }

    // Vérifier le batch
    const batch = await prisma.importBatch.findUnique({
      where: { id: parseInt(batchId) },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch non trouvé" });
    }

    // Traiter les modules EN PARALLÈLE
    const results = {};

    if (modules.includes("chapters")) {
      results.chapters = await processChapters(courseId, extractDir, user.id);
      await updateBatchStatus(batchId, "chapters", results.chapters);
    }

    if (modules.includes("pretest")) {
      results.pretest = await processPretest(courseId, extractDir);
      await updateBatchStatus(batchId, "pretest", results.pretest);
    }

    if (modules.includes("formative")) {
      results.formative = await processFormative(courseId, extractDir);
      await updateBatchStatus(batchId, "formative", results.formative);
    }

    if (modules.includes("summative")) {
      results.summative = await processSummative(courseId, extractDir);
      await updateBatchStatus(batchId, "summative", results.summative);
    }

    // Mettre à jour le statut du batch
    const allSuccess = Object.values(results).every((r) => r.success);
    await prisma.importBatch.update({
      where: { id: parseInt(batchId) },
      data: {
        status: allSuccess ? "COMPLETED" : "PARTIAL_FAIL",
        completedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      batchId,
      results,
      message: allSuccess ? "✅ Import complété avec succès!" : "⚠️ Quelques modules ont échoué",
    });

  } catch (error) {
    console.error("BATCH PROCESS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateBatchStatus(batchId, module, result) {
  const statusField = `${module}Status`;
  const errorField = `${module}Error`;
  const createdField = `${module}Created`;

  await prisma.importBatch.update({
    where: { id: parseInt(batchId) },
    data: {
      [statusField]: result.success ? "SUCCESS" : "FAILED",
      [errorField]: result.error || null,
      [createdField]: result.created || 0,
    },
  });
}

async function processChapters(courseId, extractDir, designerId) {
  try {
    const filePath = path.join(extractDir, "chapters.xlsx");
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Fichier chapters.xlsx manquant" };
    }

    const parsedData = await parseExcelFile(filePath);
    const chaptersData = parsedData.chapitres || [];

    if (chaptersData.length === 0) {
      return { success: false, error: "Aucun chapitre trouvé dans le fichier" };
    }

    let created = 0;
    let nextOrdre = 1;

    for (const chapData of chaptersData) {
      const chapter = await prisma.chapter.create({
        data: {
          title: chapData.Titre || `Chapitre ${nextOrdre}`,
          content: chapData.Contenu || "",
          ordre: nextOrdre,
          courseId: parseInt(courseId),
        },
      });

      if (chapData.Devoir && chapData.Devoir.trim()) {
        await prisma.devoir.create({
          data: {
            titre: `Devoir - ${chapter.title}`,
            consigne: chapData.Devoir,
            dateLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            chapterId: chapter.id,
          },
        });
      }

      created++;
      nextOrdre++;
    }

    console.log(`✅ ${created} chapitres créés`);
    return { success: true, created };

  } catch (error) {
    console.error("CHAPTERS ERROR:", error);
    return { success: false, error: error.message };
  }
}

async function processPretest(courseId, extractDir) {
  try {
    const filePath = path.join(extractDir, "pretest.xlsx");
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Fichier pretest.xlsx manquant" };
    }

    const parsedData = await parseExcelFile(filePath);
    const pretestData = parsedData.pretest || [];

    if (pretestData.length === 0) {
      return { success: false, error: "Aucune question pretest trouvée" };
    }

    // Supprimer le pretest existant
    await prisma.quiz.deleteMany({
      where: { courseId: parseInt(courseId), type: "PRETEST" },
    });

    const pretest = await prisma.quiz.create({
      data: {
        type: "PRETEST",
        courseId: parseInt(courseId),
      },
    });

    let created = 0;
    for (const qData of pretestData) {
      await prisma.question.create({
        data: {
          type: qData.Type || "QCM",
          texte: qData.Texte || "",
          choix: qData.Choix ? qData.Choix.split(/[,;]/).map((c) => c.trim()) : [],
          reponse: qData.Réponse || "",
          points: parseInt(qData.Points) || 1,
          quizId: pretest.id,
        },
      });
      created++;
    }

    console.log(`✅ ${created} questions pretest créées`);
    return { success: true, created };

  } catch (error) {
    console.error("PRETEST ERROR:", error);
    return { success: false, error: error.message };
  }
}

async function processFormative(courseId, extractDir) {
  try {
    const filePath = path.join(extractDir, "formative.xlsx");
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Fichier formative.xlsx manquant" };
    }

    const parsedData = await parseExcelFile(filePath);
    let formativeData = parsedData.quizFormatifs || [];
    if (formativeData.length === 0) {
      formativeData = parsedData.quizFormatif || [];
    }

    if (formativeData.length === 0) {
      return { success: false, error: "Aucune question formative trouvée" };
    }

    // Grouper par chapitre
    const quizByChapter = {};
    formativeData.forEach((q) => {
      const chapId = q.ChapitreID;
      if (!quizByChapter[chapId]) quizByChapter[chapId] = [];
      quizByChapter[chapId].push(q);
    });

    let totalCreated = 0;

    for (const [chapId, questions] of Object.entries(quizByChapter)) {
      // Vérifier que le chapitre existe
      const chapter = await prisma.chapter.findUnique({
        where: { id: parseInt(chapId) },
      });

      if (!chapter) {
        console.warn(`⚠️ Chapitre ${chapId} non trouvé`);
        continue;
      }

      // Supprimer l'ancien quiz formatif
      await prisma.quiz.deleteMany({
        where: { chapterId: parseInt(chapId), type: "FORMATIF" },
      });

      const quiz = await prisma.quiz.create({
        data: {
          type: "FORMATIF",
          chapterId: parseInt(chapId),
        },
      });

      for (const qData of questions) {
        await prisma.question.create({
          data: {
            type: qData.Type || "QCM",
            texte: qData.Texte || "",
            choix: qData.Choix ? qData.Choix.split(/[,;]/).map((c) => c.trim()) : [],
            reponse: qData.Réponse || "",
            points: parseInt(qData.Points) || 1,
            quizId: quiz.id,
          },
        });
        totalCreated++;
      }
    }

    console.log(`✅ ${totalCreated} questions formatives créées`);
    return { success: true, created: totalCreated };

  } catch (error) {
    console.error("FORMATIVE ERROR:", error);
    return { success: false, error: error.message };
  }
}

async function processSummative(courseId, extractDir) {
  try {
    const filePath = path.join(extractDir, "summative.xlsx");
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Fichier summative.xlsx manquant" };
    }

    const parsedData = await parseExcelFile(filePath);
    const summativeData = parsedData.quizSommatif || [];

    if (summativeData.length === 0) {
      return { success: false, error: "Aucune question sommative trouvée" };
    }

    // Supprimer l'ancien quiz sommatif
    await prisma.quiz.deleteMany({
      where: { courseId: parseInt(courseId), type: "SOMMATIF" },
    });

    const quiz = await prisma.quiz.create({
      data: {
        type: "SOMMATIF",
        courseId: parseInt(courseId),
      },
    });

    let created = 0;
    for (const qData of summativeData) {
      await prisma.question.create({
        data: {
          type: qData.Type || "QCM",
          texte: qData.Texte || "",
          choix: qData.Choix ? qData.Choix.split(/[,;]/).map((c) => c.trim()) : [],
          reponse: qData.Réponse || "",
          points: parseInt(qData.Points) || 1,
          quizId: quiz.id,
        },
      });
      created++;
    }

    console.log(`✅ ${created} questions sommatives créées`);
    return { success: true, created };

  } catch (error) {
    console.error("SUMMATIVE ERROR:", error);
    return { success: false, error: error.message };
  }
}
