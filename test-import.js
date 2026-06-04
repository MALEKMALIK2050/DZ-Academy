#!/usr/bin/env node

/**
 * Test Script for LMS Import Course System
 * Usage: node test-import.js <path-to-pdf-or-docx> [designerId]
 * Example: node test-import.js ./my-course.pdf 1
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const designerId = process.argv[3] || '1';
const filePath = process.argv[2];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(`${colors[color]}${args.join(' ')}${colors.reset}`);
}

async function test() {
  log('cyan', '🚀 LMS Import Course - Test Script');
  log('cyan', '==================================\n');

  // Validation
  if (!filePath) {
    log('red', '❌ Usage: node test-import.js <file.pdf|file.docx> [designerId]');
    log('red', '   Example: node test-import.js ./course.pdf 1');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    log('red', `❌ Fichier introuvable: ${filePath}`);
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!['.pdf', '.docx'].includes(ext)) {
    log('red', '❌ Format non supporté. Utilisez .pdf ou .docx');
    process.exit(1);
  }

  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;

  log('green', `✅ Fichier: ${fileName}`);
  log('green', `✅ Taille: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  log('green', `✅ Designer ID: ${designerId}`);
  log('cyan', `✅ API: ${API_URL}\n`);

  try {
    // STEP 1: Upload
    log('blue', '📤 ÉTAPE 1: Upload du fichier...');
    const uploadResponse = await uploadFile(filePath, designerId);
    
    if (!uploadResponse.success) {
      log('red', `❌ Upload échoué: ${uploadResponse.error}`);
      process.exit(1);
    }

    log('green', `✅ Upload réussi`);
    log('green', `   Filepath: ${uploadResponse.file.filepath}`);

    // STEP 2: Process
    log('blue', '\n⚙️  ÉTAPE 2: Traitement du fichier...');
    log('yellow', '   (Extraction texte → OpenAI → Création BD)');
    log('yellow', '   ⏳ Attendre 30-60 secondes...\n');

    const processResponse = await processFile(
      uploadResponse.file.filepath,
      designerId
    );

    if (!processResponse.success) {
      log('red', `❌ Traitement échoué: ${processResponse.error}`);
      if (processResponse.details) {
        log('red', `   Détails: ${processResponse.details}`);
      }
      process.exit(1);
    }

    // SUCCESS
    log('green', '\n✅ SUCCÈS! Cours créé avec succès\n');
    log('green', '📊 RÉSULTATS:');
    log('cyan', `   ID: ${processResponse.course.id}`);
    log('cyan', `   Titre: ${processResponse.course.title}`);
    log('cyan', `   Description: ${processResponse.course.description}`);
    log('cyan', `   Objectifs: ${processResponse.course.objectifs}`);
    log('cyan', `   Chapitres: ${processResponse.course.chaptersCount}`);

    if (processResponse.chapters && processResponse.chapters.length > 0) {
      log('green', '\n📚 CHAPITRES CRÉÉS:');
      processResponse.chapters.forEach((chapter, index) => {
        log('cyan', `   ${index + 1}. ${chapter.title}`);
      });
    }

    log('green', '\n✅ Test terminé avec succès!');
    log('green', `   Vérifiez en BD: npx prisma studio`);

  } catch (error) {
    log('red', `\n❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Upload file to server
 */
async function uploadFile(filePath, designerId) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    const form = new (require('form-data'))();
    form.append('file', fileStream, fileName);
    form.append('designerId', designerId);

    const protocol = API_URL.startsWith('https') ? https : http;
    const url = new URL(`${API_URL}/api/import-course/upload`);

    const options = {
      method: 'POST',
      headers: form.getHeaders(),
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * Process file on server
 */
async function processFile(filepath, designerId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      filepath,
      designerId: parseInt(designerId, 10),
    });

    const protocol = API_URL.startsWith('https') ? https : http;
    const url = new URL(`${API_URL}/api/import-course/process`);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run test
test().catch((error) => {
  log('red', `\n❌ Erreur non gérée: ${error.message}`);
  process.exit(1);
});