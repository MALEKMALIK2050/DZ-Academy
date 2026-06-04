/**
 * 🛠️ FONCTIONS UTILITAIRES - GESTION DU PROFIL UTILISATEUR
 * 
 * Fichier: lib/user.service.ts (ou .js)
 * 
 * Fonctions réutilisables pour la gestion du profil
 */

import prisma from "@/lib/prisma";
const db = prisma;
import { NiveauScolaire, StatutProfil, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// ============================================
// 📊 PROFIL COMPLETION
// ============================================

/**
 * Calculer le pourcentage de complétude du profil
 */
export async function calculateProfileCompletion(userId: number): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) return 0;

  // Champs à vérifier
  const fields = [
    user.prenom,
    user.nom,
    user.photo,
    user.telephone,
    user.adresse,
    user.codePostal,
    user.ville,
    user.dateNaissance,
    user.lieuNaissance,
    user.ecole,
    user.niveauScolaire
  ];

  // Compter les champs remplis
  const filledFields = fields.filter(
    f => f && f !== null && f !== ""
  ).length;

  // Calculer le pourcentage
  const percentage = Math.round((filledFields / fields.length) * 100);

  return percentage;
}

/**
 * Mettre à jour le statut de complétude du profil
 */
export async function updateProfileCompletion(userId: number): Promise<void> {
  const percentage = await calculateProfileCompletion(userId);

  // Déterminer le statut
  let status: StatutProfil;
  if (percentage === 0) {
    status = StatutProfil.INCOMPLET;
  } else if (percentage < 100) {
    status = StatutProfil.PARTIELLEMENT_COMPLET;
  } else {
    status = StatutProfil.COMPLET;
  }

  // Mettre à jour en BD
  await db.user.update({
    where: { id: userId },
    data: {
      pourcentageCompletion: percentage,
      statutProfil: status,
      profilComplet: percentage === 100
    }
  });
}

/**
 * Obtenir le profil complet d'un utilisateur avec stats
 */
export async function getUserProfile(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      photo: true,
      telephone: true,
      adresse: true,
      codePostal: true,
      ville: true,
      pays: true,
      dateNaissance: true,
      lieuNaissance: true,
      ecole: true,
      niveauScolaire: true,
      classe: true,
      tuteurNom: true,
      tuteurPrenom: true,
      tuteurTelephone: true,
      pourcentageCompletion: true,
      statutProfil: true,
      profilComplet: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      // Stats
      enrollments: {
        select: {
          id: true,
          course: { select: { id: true, titre: true } },
          progress: true,
          completedAt: true
        }
      },
      quizResults: {
        select: {
          id: true,
          score: true,
          pourcentage: true,
          completedAt: true
        },
        orderBy: { completedAt: "desc" },
        take: 5
      }
    }
  });

  if (!user) return null;

  // Calculer les stats
  const totalCourses = user.enrollments.length;
  const completedCourses = user.enrollments.filter(e => e.completedAt).length;
  const averageQuizScore = user.quizResults.length > 0
    ? Math.round(
      user.quizResults.reduce((sum, q) => sum + q.score, 0) /
      user.quizResults.length
    )
    : 0;

  return {
    ...user,
    stats: {
      totalCourses,
      completedCourses,
      averageQuizScore,
      totalQuizzes: user.quizResults.length
    }
  };
}

// ============================================
// 🔐 MOT DE PASSE
// ============================================

/**
 * Changer le mot de passe utilisateur
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Récupérer l'utilisateur
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return { success: false, message: "Utilisateur introuvable" };
  }

  // Vérifier l'ancien mot de passe
  const isValidPassword = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isValidPassword) {
    return { success: false, message: "Le mot de passe actuel est incorrect" };
  }

  // Vérifier que le nouveau est différent
  if (currentPassword === newPassword) {
    return {
      success: false,
      message: "Le nouveau mot de passe doit être différent de l'actuel"
    };
  }

  // Valider la force du mot de passe
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Mettre à jour
  await db.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  return { success: true, message: "Mot de passe changé avec succès" };
}

/**
 * Valider la force du mot de passe
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message: string;
  strength: "VERY_WEAK" | "WEAK" | "FAIR" | "GOOD" | "STRONG" | "VERY_STRONG";
} {
  // Critères
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Compter les critères remplis
  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  // Déterminer la force
  let strength: "VERY_WEAK" | "WEAK" | "FAIR" | "GOOD" | "STRONG" | "VERY_STRONG";
  let valid = true;
  let message = "";

  if (criteriaCount <= 1) {
    strength = "VERY_WEAK";
    valid = false;
    message = "Mot de passe très faible";
  } else if (criteriaCount === 2) {
    strength = "WEAK";
    valid = false;
    message = "Mot de passe faible";
  } else if (criteriaCount === 3) {
    strength = "FAIR";
    valid = true;
    message = "Mot de passe acceptable";
  } else if (criteriaCount === 4) {
    strength = "GOOD";
    valid = true;
    message = "Mot de passe bon";
  } else {
    strength = "VERY_STRONG";
    valid = true;
    message = "Mot de passe très fort";
  }

  // Messages d'erreur spécifiques
  if (!valid) {
    if (!hasMinLength) message += " (min 8 caractères)";
    if (!hasUppercase) message += " (min 1 majuscule)";
    if (!hasNumber) message += " (min 1 chiffre)";
    if (!hasSpecialChar) message += " (min 1 caractère spécial)";
  }

  return { valid, message, strength };
}

/**
 * Obtenir la couleur de force du mot de passe
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case "VERY_WEAK": return "#dc2626"; // Rouge
    case "WEAK": return "#f97316"; // Orange
    case "FAIR": return "#eab308"; // Jaune
    case "GOOD": return "#84cc16"; // Vert clair
    case "STRONG": return "#22c55e"; // Vert
    case "VERY_STRONG": return "#059669"; // Vert foncé
    default: return "#6b7280";
  }
}

// ============================================
// 📸 PHOTO DE PROFIL
// ============================================

/**
 * Mettre à jour la photo de profil
 */
export async function updateProfilePhoto(
  userId: number,
  photoPath: string
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { photo: photoPath },
    select: { id: true }
  });

  // Mettre à jour la complétude
  await updateProfileCompletion(userId);
}

/**
 * Supprimer la photo de profil
 */
export async function deleteProfilePhoto(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { photo: null }
  });

  // Mettre à jour la complétude
  await updateProfileCompletion(userId);
}

// ============================================
// 👥 RECHERCHE UTILISATEUR
// ============================================

/**
 * Rechercher des utilisateurs par niveau scolaire
 */
export async function getUsersByLevel(
  niveau: NiveauScolaire,
  limit = 20,
  skip = 0
) {
  return await db.user.findMany({
    where: { niveauScolaire: niveau, active: true },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      photo: true,
      niveauScolaire: true,
      classe: true
    },
    take: limit,
    skip
  });
}

/**
 * Rechercher des utilisateurs par rôle
 */
export async function getUsersByRole(
  role: Role,
  limit = 20,
  skip = 0
) {
  return await db.user.findMany({
    where: { role, active: true },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      photo: true,
      role: true
    },
    take: limit,
    skip
  });
}

/**
 * Recherche globale d'utilisateurs
 */
export async function searchUsers(
  query: string,
  limit = 20
) {
  return await db.user.findMany({
    where: {
      OR: [
        { nom: { contains: query, mode: "insensitive" } },
        { prenom: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } }
      ],
      active: true
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      photo: true,
      niveauScolaire: true,
      role: true
    },
    take: limit
  });
}

// ============================================
// 📊 STATISTIQUES
// ============================================

/**
 * Obtenir les stats globales de l'utilisateur
 */
export async function getUserStats(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  const [enrollments, quizzes, forums, messages] = await Promise.all([
    db.enrollment.findMany({
      where: { studentId: userId },
      select: { progress: true, completedAt: true }
    }),
    db.quizResult.findMany({
      where: { userId },
      select: { score: true }
    }),
    db.forumPost.findMany({
      where: { createdById: userId }
    }),
    db.message.findMany({
      where: { senderId: userId }
    })
  ]);

  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  const averageScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
    : 0;

  return {
    profileCompletion: user.pourcentageCompletion,
    coursesEnrolled: enrollments.length,
    coursesCompleted: enrollments.filter(e => e.completedAt).length,
    averageProgress,
    quizzesTaken: quizzes.length,
    averageScore,
    forumPostsCreated: forums.length,
    messagesSent: messages.length,
    lastActive: user.lastLoginAt,
    profileStatus: user.statutProfil
  };
}

// ============================================
// 🔄 MISE À JOUR DE PROFIL
// ============================================

/**
 * Mettre à jour les informations personnelles
 */
export async function updateUserProfile(
  userId: number,
  data: {
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    ecole?: string;
    niveauScolaire?: NiveauScolaire;
  }
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });

  // Mettre à jour la complétude
  await updateProfileCompletion(userId);
}

/**
 * Enregistrer la dernière connexion
 */
export async function recordLogin(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      active: true
    }
  });
}

/**
 * Soft delete d'un utilisateur
 */
export async function deleteUserSoftly(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      active: false
    }
  });
}

/**
 * Restaurer un utilisateur soft-deleted
 */
export async function restoreUser(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      deletedAt: null,
      active: true
    }
  });
}

// ============================================
// 📋 HELPER FUNCTIONS
// ============================================

/**
 * Formater le nom complet
 */
export function formatFullName(user: {
  prenom: string;
  nom: string;
}): string {
  return `${user.prenom} ${user.nom}`.trim();
}

/**
 * Obtenir les initiales
 */
export function getInitials(user: {
  prenom: string;
  nom: string;
}): string {
  return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
}

/**
 * Traduire le niveau scolaire en français
 */
export const niveauScolaireLabels: Record<NiveauScolaire, string> = {
  [NiveauScolaire.PRIMAIRE]: "Primaire",
  [NiveauScolaire.CEM]: "CEM",
  [NiveauScolaire.LYCEE]: "Lycée",
  [NiveauScolaire.BAC]: "Baccalauréat",
  [NiveauScolaire.LICENCE]: "Licence",
  [NiveauScolaire.MASTER]: "Master",
  [NiveauScolaire.DOCTORAT]: "Doctorat"
};

/**
 * Traduire le rôle en français
 */
export const roleLabels: Record<Role, string> = {
  [Role.STUDENT]: "Étudiant",
  [Role.TEACHER]: "Enseignant",
  [Role.DESIGNER]: "Concepteur",
  [Role.ADMIN]: "Administrateur"
};

/**
 * Traduire le statut du profil
 */
export const statutProfilLabels: Record<StatutProfil, string> = {
  [StatutProfil.INCOMPLET]: "Incomplet",
  [StatutProfil.PARTIELLEMENT_COMPLET]: "Partiellement complété",
  [StatutProfil.COMPLET]: "Complété"
};

export default {
  calculateProfileCompletion,
  updateProfileCompletion,
  getUserProfile,
  changePassword,
  validatePasswordStrength,
  getPasswordStrengthColor,
  updateProfilePhoto,
  deleteProfilePhoto,
  getUsersByLevel,
  getUsersByRole,
  searchUsers,
  getUserStats,
  updateUserProfile,
  recordLogin,
  deleteUserSoftly,
  restoreUser,
  formatFullName,
  getInitials,
  niveauScolaireLabels,
  roleLabels,
  statutProfilLabels
};
