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
    const XLSX = await import('xlsx');
    const buffer = Buffer.from(fileBase64, 'base64');
    const tmpFile = `${os.tmpdir()}/quiz-${Date.now()}.xlsx`;
    
    fs.writeFileSync(tmpFile, buffer);
    const workbook = XLSX.readFile(tmpFile);
    fs.unlinkSync(tmpFile);

    const questions = XLSX.utils.sheet_to_json(workbook.Sheets['Quiz Sommatif'] || {});

    let quiz = await prisma.quiz.findFirst({
      where: { courseId: parseInt(courseId), type: 'SOMMATIF' }
    });

    if (quiz) {
      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    } else {
      quiz = await prisma.quiz.create({
        data: { courseId: parseInt(courseId), type: 'SOMMATIF' }
      });
    }

    let created = 0;
    for (const row of questions) {
      const texte = row['Question'] != null ? String(row['Question']).trim() : '';
      const option1 = row['Option1'] != null ? String(row['Option1']).trim() : '';
      const option2 = row['Option2'] != null ? String(row['Option2']).trim() : '';
      const option3 = row['Option3'] != null ? String(row['Option3']).trim() : '';
      const option4 = row['Option4'] != null ? String(row['Option4']).trim() : '';
      const reponse = row['Réponse'] != null ? String(row['Réponse']).trim() : '';
      const points = parseInt(row['Points'] || 1);

      if (!texte || !reponse) continue;

      await prisma.question.create({
        data: {
          quizId: quiz.id,
          texte,
          choix: [option1, option2, option3, option4].filter(c => c),
          reponse,
          points,
          type: 'QCM',
        },
      });
      created++;
    }

    return res.status(200).json({ success: true, created, quizId: quiz.id });
  } catch (error) {
    console.error('ERREUR IMPORT QUIZ:', error);
    return res.status(500).json({ error: error.message });
  }
}