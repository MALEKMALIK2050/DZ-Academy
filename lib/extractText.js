const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extrait le texte d'un fichier PDF ou DOCX
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<string>} - Texte extrait
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      return await extractFromPDF(filePath);
    } else if (ext === '.docx') {
      return await extractFromDOCX(filePath);
    } else {
      throw new Error(`Format non supporté: ${ext}. Utilisez PDF ou DOCX.`);
    }
  } catch (error) {
    console.error(`Erreur extraction ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Extrait le texte d'un PDF
 */
async function extractFromPDF(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text || '';
  } catch (error) {
    throw new Error(`Erreur lecture PDF: ${error.message}`);
  }
}

/**
 * Extrait le texte d'un DOCX
 */
async function extractFromDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
    throw new Error(`Erreur lecture DOCX: ${error.message}`);
  }
}

module.exports = {
  extractTextFromFile,
  extractFromPDF,
  extractFromDOCX,
};
