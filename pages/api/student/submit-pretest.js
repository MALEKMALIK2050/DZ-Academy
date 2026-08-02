import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getFeedbackByScore } from "@/lib/pretestGenerator";

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });

  const { courseId } = req.query;
  const { reponses } = req.body;

  console.log('📋 Submit Pretest:', { courseId, reponses });

  if (!courseId || !reponses) {
    return res.status(400).json({ error: 'courseId et reponses requis' });
  }

  try {
    const pretest = await prisma.pretest.findFirst({
      where: { courseId: parseInt(courseId) },
      include: { questions: true, course: true },
    });

    if (!pretest) return res.status(404).json({ error: 'Pretest non trouvé' });

    let correct = 0;
    for (const q of pretest.questions) {
      if (reponses[q.id] == q.reponse) correct++;
    }

    const total = pretest.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const feedback = getFeedbackByScore(percentage, 100, pretest.course?.annee);

    // UPDATE au lieu de CREATE
    const result = await prisma.pretestResult.upsert({
      where: {
        studentId_courseId: {
          studentId: parseInt(user.id),
          courseId: parseInt(courseId),
        },
      },
      update: {
        score: correct,
        total: total,
        pourcentage: percentage,
        reponses: reponses,
      },
      create: {
        studentId: parseInt(user.id),
        courseId: parseInt(courseId),
        score: correct,
        total: total,
        pourcentage: percentage,
        reponses: reponses,
      },
    });

    console.log('✅ Pretest complété:', { correct, total, percentage });

    return res.status(200).json({ 
      success: true, 
      data: { score: correct, correct, total, percentage, pourcentage: percentage, feedback }
    });
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return res.status(500).json({ error: error.message });
  }
}