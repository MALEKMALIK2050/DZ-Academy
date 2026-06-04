import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from 'fs';
import XLSX from 'xlsx';

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUser(req);
  if (!user || user.role !== 'DESIGNER') {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { filepath, chapterId } = req.body;

  if (!filepath || !chapterId) {
    return res.status(400).json({ error: 'filepath et chapterId requis' });
  }

  try {
    const workbook = XLSX.readFile(filepath);
    
    let sheet = workbook.Sheets['Quiz Formatif'];
    if (!sheet) {
      sheet = workbook.Sheets[workbook.SheetNames[0]];
    }
    
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: false }); // ← Force le texte

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Aucune question trouvée' });
    }

    const existingQuiz = await prisma.quiz.findFirst({
      where: { chapterId: parseInt(chapterId), type: 'FORMATIF' }
    });

    if (existingQuiz) {
      await prisma.question.deleteMany({ where: { quizId: existingQuiz.id } });
    }

    const quiz = await prisma.quiz.upsert({
      where: { id: existingQuiz?.id || 0 },
      update: {},
      create: { chapterId: parseInt(chapterId), type: 'FORMATIF' }
    });

    let created = 0;
    for (const row of rows) {
      // Fonction utilitaire pour convertir proprement
      const toString = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return value.toString();
        if (value instanceof Date) return value.toLocaleDateString('fr-CA'); // YYYY-MM-DD
        return String(value);
      };

      let texte = toString(row['Texte'] || row['Question']);
      if (!texte) continue;

      // Gérer Choix (string ou tableau)
      let choix = [];
      const choixRaw = row['Choix'];
      
      if (choixRaw && typeof choixRaw === 'string') {
        choix = choixRaw.split(';').map(c => toString(c).trim()).filter(c => c);
      } else if (Array.isArray(choixRaw)) {
        choix = choixRaw.map(c => toString(c)).filter(c => c);
      } else if (choixRaw) {
        choix = [toString(choixRaw)];
      }

      // Fallback: Option1, Option2, etc.
      if (choix.length === 0) {
        const opt1 = toString(row['Option1']);
        const opt2 = toString(row['Option2']);
        const opt3 = toString(row['Option3']);
        const opt4 = toString(row['Option4']);
        choix = [opt1, opt2, opt3, opt4].filter(c => c);
      }

      let reponse = toString(row['Réponse']);
      let points = parseInt(row['Points'] || 1);

      if (!texte || !reponse || choix.length === 0) {
        console.log('Question ignorée (données manquantes):', texte);
        continue;
      }

      await prisma.question.create({
        data: {
          quizId: quiz.id,
          texte: texte,
          choix: choix,
          reponse: reponse,
          points: points,
          type: 'QCM',
        },
      });
      created++;
    }

    try { fs.unlinkSync(filepath); } catch(e) {}

    return res.status(200).json({ success: true, created, quizId: quiz.id });

  } catch (error) {
    console.error('ERREUR IMPORT QUIZ FORMATIF:', error);
    return res.status(500).json({ error: error.message });
  }
}