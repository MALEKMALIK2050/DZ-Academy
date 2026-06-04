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

  const { filepath, chapterId } = req.body;

  if (!filepath || !chapterId) {
    return res.status(400).json({ error: 'filepath et chapterId requis' });
  }

  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.readFile(filepath);
    
    // Prend la première sheet (n'importe quel nom)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Aucune question trouvée' });
    }

    // Supprimer l'ancien quiz formatif pour ce chapitre
    const existingQuiz = await prisma.quiz.findFirst({
      where: { chapterId: parseInt(chapterId), type: 'FORMATIF' }
    });

    if (existingQuiz) {
      await prisma.question.deleteMany({ where: { quizId: existingQuiz.id } });
    }

    // Créer ou récupérer le quiz
    const quiz = await prisma.quiz.upsert({
      where: { id: existingQuiz?.id || 0 },
      update: {},
      create: { chapterId: parseInt(chapterId), type: 'FORMATIF' }
    });

    let created = 0;
    for (const row of rows) {
      // Lire les colonnes comme dans pretest.js
      const texte = row['Question'] != null ? String(row['Question']).trim() : '';
      if (!texte) continue;

      const option1 = row['Option1'] != null ? String(row['Option1']).trim() : '';
      const option2 = row['Option2'] != null ? String(row['Option2']).trim() : '';
      const option3 = row['Option3'] != null ? String(row['Option3']).trim() : '';
      const option4 = row['Option4'] != null ? String(row['Option4']).trim() : '';
      const reponse = row['Réponse'] != null ? String(row['Réponse']).trim() : '';
      const points = parseInt(row['Points'] || 1);

      if (!texte || !reponse) continue;

      const choix = [option1, option2, option3, option4].filter(c => c !== '');

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
      created++;
    }

    // Nettoyer le fichier temporaire
    fs.unlinkSync(filepath);

    return res.status(200).json({ success: true, created, quizId: quiz.id });

  } catch (error) {
    console.error('ERREUR IMPORT QUIZ FORMATIF:', error);
    return res.status(500).json({ error: error.message });
  }
}