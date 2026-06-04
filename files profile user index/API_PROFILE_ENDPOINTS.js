/**
 * 🔧 API ENDPOINTS POUR LE PROFIL UTILISATEUR
 * 
 * Fichiers à créer:
 * 1. pages/api/profile/me.js
 * 2. pages/api/profile/update.js
 * 3. pages/api/profile/change-password.js
 */

// ============================================
// 1️⃣ GET /api/profile/me
// ============================================
// pages/api/profile/me.js

import { withAuth } from "@/middleware/withAuth";

export default withAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const userId = req.user.id;

    // Récupérer le profil utilisateur
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        photo: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        dateNaissance: true,
        lieuNaissance: true,
        etablissement: true,
        niveauScolarisation: true,
        telephone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // Calculer le pourcentage de complétude du profil
    const completionPercent = calculateProfileCompletion(user);

    return res.status(200).json({
      ...user,
      completionPercent
    });
  } catch (error) {
    console.error("❌ Erreur fetch profil:", error);
    return res.status(500).json({ error: error.message });
  }
});

function calculateProfileCompletion(user) {
  const fields = [
    user.prenom,
    user.nom,
    user.email,
    user.photo,
    user.adresse,
    user.ville,
    user.dateNaissance,
    user.lieuNaissance,
    user.etablissement,
    user.telephone
  ];

  const filledFields = fields.filter(field => field && field !== null && field !== "").length;
  return Math.round((filledFields / fields.length) * 100);
}

// ============================================
// 2️⃣ PUT /api/profile/update
// ============================================
// pages/api/profile/update.js

import { withAuth } from "@/middleware/withAuth";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";

export const config = {
  api: {
    bodyParser: false // Désactiver pour traiter les fichiers
  }
};

export default withAuth(async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const userId = req.user.id;

    // Parser le formulaire avec fichier
    const form = formidable({
      multiples: false,
      uploadDir: path.join(process.cwd(), "public/uploads/profiles"),
      keepExtensions: true
    });

    // Créer le dossier s'il n'existe pas
    try {
      await fs.mkdir(path.join(process.cwd(), "public/uploads/profiles"), {
        recursive: true
      });
    } catch (err) {
      // Dossier existe déjà
    }

    const [fields, files] = await form.parse(req);

    // Extraire les champs
    const getData = (fieldName) => {
      const field = fields[fieldName];
      return field ? (Array.isArray(field) ? field[0] : field) : null;
    };

    const updateData = {
      adresse: getData("adresse") || undefined,
      codePostal: getData("codePostal") || undefined,
      ville: getData("ville") || undefined,
      pays: getData("pays") || undefined,
      dateNaissance: getData("dateNaissance") ? new Date(getData("dateNaissance")) : undefined,
      lieuNaissance: getData("lieuNaissance") || undefined,
      etablissement: getData("etablissement") || undefined,
      niveauScolarisation: getData("niveauScolarisation") || undefined,
      telephone: getData("telephone") || undefined
    };

    // Nettoyer les undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Gérer la photo si présente
    if (files.photo) {
      const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
      
      // Supprimer l'ancienne photo si elle existe
      const existingUser = await db.user.findUnique({
        where: { id: userId },
        select: { photo: true }
      });

      if (existingUser?.photo) {
        try {
          const oldPhotoPath = path.join(
            process.cwd(),
            "public",
            existingUser.photo
          );
          await fs.unlink(oldPhotoPath);
        } catch (err) {
          console.warn("Impossible de supprimer l'ancienne photo:", err);
        }
      }

      // Générer un nom unique pour la nouvelle photo
      const timestamp = Date.now();
      const newPhotoName = `${userId}-${timestamp}${path.extname(photoFile.originalFilename)}`;
      const newPhotoPath = path.join(
        process.cwd(),
        "public/uploads/profiles",
        newPhotoName
      );

      // Copier le fichier uploadé
      await fs.copyFile(photoFile.filepath, newPhotoPath);

      // Ajouter à updateData
      updateData.photo = `/uploads/profiles/${newPhotoName}`;

      // Nettoyer le fichier temporaire
      try {
        await fs.unlink(photoFile.filepath);
      } catch (err) {
        console.warn("Impossible de nettoyer fichier temporaire");
      }
    }

    // Mettre à jour en DB
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        photo: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        dateNaissance: true,
        lieuNaissance: true,
        etablissement: true,
        niveauScolarisation: true,
        telephone: true
      }
    });

    const completionPercent = calculateProfileCompletion(updatedUser);

    return res.status(200).json({
      ...updatedUser,
      completionPercent,
      message: "Profil mis à jour avec succès"
    });
  } catch (error) {
    console.error("❌ Erreur update profil:", error);
    return res.status(500).json({ error: error.message });
  }
});

function calculateProfileCompletion(user) {
  const fields = [
    user.prenom,
    user.nom,
    user.email,
    user.photo,
    user.adresse,
    user.ville,
    user.dateNaissance,
    user.lieuNaissance,
    user.etablissement,
    user.telephone
  ];

  const filledFields = fields.filter(field => field && field !== null && field !== "").length;
  return Math.round((filledFields / fields.length) * 100);
}

// ============================================
// 3️⃣ POST /api/profile/change-password
// ============================================
// pages/api/profile/change-password.js

import { withAuth } from "@/middleware/withAuth";
import bcrypt from "bcryptjs";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Les mots de passe actuels et nouveaux sont obligatoires"
      });
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      return res.status(401).json({
        error: "❌ Le mot de passe actuel est incorrect"
      });
    }

    // Vérifier que le nouveau mot de passe est différent
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "❌ Le nouveau mot de passe doit être différent de l'actuel"
      });
    }

    // Valider la force du mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: `❌ ${passwordValidation.message}`
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Log de sécurité (optionnel)
    console.log(`🔐 Mot de passe changé pour l'utilisateur ${userId}`);

    return res.status(200).json({
      success: true,
      message: "✅ Votre mot de passe a été changé avec succès"
    });
  } catch (error) {
    console.error("❌ Erreur changement mot de passe:", error);
    return res.status(500).json({ error: error.message });
  }
});

function validatePassword(password) {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins 8 caractères"
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins une majuscule"
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins un chiffre"
    };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)"
    };
  }

  return { valid: true };
}

// ============================================
// 🔐 MIDDLEWARE D'AUTHENTIFICATION
// ============================================
// lib/middleware/withAuth.js

import { getSession } from "next-auth/react";

export async function withAuth(handler) {
  return async (req, res) => {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    };

    return handler(req, res);
  };
}

// ============================================
// 📊 STRUCTURE PRISMA (schema.prisma)
// ============================================
/**
model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  prenom    String
  nom       String
  password  String
  photo     String?  // URL de la photo de profil
  role      String  // STUDENT, DESIGNER, ADMIN
  
  // 📝 Données personnelles
  adresse   String?
  codePostal String?
  ville     String?
  pays      String? @default("Algérie")
  
  // 🎂 Naissance
  dateNaissance  DateTime?
  lieuNaissance  String?
  
  // 🎓 Scolarisation
  etablissement  String?
  niveauScolarisation String? // Primaire, CEM, Secondaire, Bac, Licence, Master, Doctorat
  
  // 📞 Contact
  telephone String?
  
  // ⏰ Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  courses   Enrollment[]
  designedCourses Course[]
  quizzes   QuizCompletion[]
}
*/
