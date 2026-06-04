import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(os.tmpdir(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erreur parse:', err);
        return res.status(500).json({ error: err.message });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: 'Aucun fichier reçu' });
      }

      const uploadedFile = Array.isArray(file) ? file[0] : file;
      const filepath = uploadedFile.filepath;

      return res.status(200).json({
        success: true,
        file: {
          filepath: filepath,
          originalName: uploadedFile.originalFilename,
          size: uploadedFile.size,
        },
      });
    });
  } catch (error) {
    console.error('ERREUR UPLOAD:', error);
    return res.status(500).json({ error: error.message });
  }
}