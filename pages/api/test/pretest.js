import fs from 'fs';
import os from 'os';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileBase64 } = req.body;

  try {
    console.log('📋 Test Pretest...');
    
    const XLSX = await import('xlsx');
    const buffer = Buffer.from(fileBase64, 'base64');
    const tmpFile = `${os.tmpdir()}/test-${Date.now()}.xlsx`;
    
    fs.writeFileSync(tmpFile, buffer);
    const workbook = XLSX.readFile(tmpFile);
    fs.unlinkSync(tmpFile);

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    // À la ligne où on affiche les logs:
            for (const row of rows) {
  const question = row['Texte'] || '';  // ← TEXTE au lieu de Question
  if (!question) continue;

  const choixString = row['Choix'] || '';
  const choix = choixString.split(';').map(c => c.trim()).filter(c => c);  // ← Split par ;

  await prisma.question.create({
    data: {
      quizId: pretest.id,
      texte: question,
      choix: choix,  // ← Maintenant c'est un array
      reponse: row['Réponse'] || '',
      type: row['Type'] || 'QCM',
      points: parseInt(row['Points'] || 1),
    },
  });
  created++;
}

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}