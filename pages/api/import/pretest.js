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

  console.log('🔍 DEBUG:', { courseId, hasFileBase64: !!fileBase64 });

  if (!courseId || !fileBase64) {
    return res.status(400).json({ error: 'courseId et fileBase64 requis', courseId, fileBase64: !!fileBase64 });
  }

  try {
    console.log('📋 Pretest...');
    const courseInt = parseInt(courseId);
    
    if (isNaN(courseInt)) {
      return res.status(400).json({ error: `courseId invalide: ${courseId}` });
    }

    const XLSX = await import('xlsx');
    const buffer = Buffer.from(fileBase64, 'base64');
    const tmpFile = `${os.tmpdir()}/pretest-${Date.now()}.xlsx`;
    
    fs.writeFileSync(tmpFile, buffer);
    const workbook = XLSX.readFile(tmpFile);
    fs.unlinkSync(tmpFile);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log('📊 Rows:', rows.length);
    if (rows.length > 0) console.log('Première:', rows[0]);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Aucune question trouvée' });
    }

    // Supprimer ancien pretest
    const existingPretest = await prisma.pretest.findFirst({
      where: { courseId: courseInt },
    });
    if (existingPretest) {
      console.log('Suppression ancien pretest...');
      await prisma.question.deleteMany({
        where: { quizId: existingPretest.id },
      });
      await prisma.pretest.delete({ where: { id: existingPretest.id } });
    }

// Créer pretest
const pretest = await prisma.pretest.create({
  data: { courseId: courseInt },
});
console.log('✅ Pretest créé - ID:', pretest.id, 'CourseID:', courseInt);

let created = 0;
for (const row of rows) {
  const question = row['Question'] || '';
  if (!question) continue;

  console.log(`📌 Créer Q${created + 1} avec pretestId=${pretest.id}`);

  const choix = [
    row['Option1'] != null ? String(row['Option1']).trim() : '',
    row['Option2'] != null ? String(row['Option2']).trim() : '',
    row['Option3'] != null ? String(row['Option3']).trim() : '',
    row['Option4'] != null ? String(row['Option4']).trim() : '',
  ].filter(o => o !== '');

  const reponse = row['Réponse'] != null ? String(row['Réponse']).trim() : '';

  await prisma.pretestQuestion.create({  // ← PRETESTQUESTION au lieu de QUESTION
    data: {
      pretestId: pretest.id,  // ← pretestId au lieu de quizId
      texte: question,
      choix: choix,
      reponse: reponse,
      points: parseInt(row['Points'] || 1),
    },
  });
  created++;
}
    console.log(`✅ ${created} questions créées!`);

    return res.status(200).json({
      success: true,
      message: `✅ ${created} questions importées`,
      created,
    });

  } catch (error) {
    console.error('❌ ERREUR PRETEST:', error.message);
    return res.status(500).json({ error: error.message });
  }
}