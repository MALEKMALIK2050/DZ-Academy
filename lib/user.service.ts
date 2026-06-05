/**
 * 🛠️ FONCTIONS UTILITAIRES - GESTION DU PROFIL UTILISATEUR
 * 
 * Fichier: lib/user.service.ts
 */

import prisma from "@/lib/prisma";
const db = prisma;
import { NiveauScolaire, StatutProfil, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// ============================================
// 📊 PROFIL COMPLETION
// ============================================

export async function calculateProfileCompletion(userId: number): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) return 0;

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

  const filledFields = fields.filter((f): f is NonNullable<typeof f> => 
    f !== null && f !== undefined && f !== ""
  ).length;

  const percentage = Math.round((filledFields / fields.length) * 100);
  return percentage;
}

export async function updateProfileCompletion(userId: number): Promise<void> {
  const percentage = await calculateProfileCompletion(userId);

  let status: StatutProfil;
  if (percentage === 0) {
    status = StatutProfil.INCOMPLET;
  } else if (percentage < 100) {
    status = StatutProfil.PARTIELLEMENT_COMPLET;
  } else {
    status = StatutProfil.COMPLET;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      pourcentageCompletion: percentage,
      statutProfil: status,
      profilComplet: percentage === 100
    }
  });
}

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
      enrollments: {
        select: {
          id: true,
          course: { select: { id: true, title: true } },
          progress: true
        }
      },
      quizResults: {
        select: {
          id: true,
          score: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!user) return null;

  const totalCourses = user.enrollments.length;
  const completedCourses = user.enrollments.filter((e) => e.progress === 100).length;
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

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return { success: false, message: "Utilisateur introuvable" };
  }

  const isValidPassword = await bcrypt.compare(
    currentPassword,
    user.password || ""
  );

  if (!isValidPassword) {
    return { success: false, message: "Le mot de passe actuel est incorrect" };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      message: "Le nouveau mot de passe doit être différent de l'actuel"
    };
  }

  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  return { success: true, message: "Mot de passe changé avec succès" };
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  message: string;
  strength: "VERY_WEAK" | "WEAK" | "FAIR" | "GOOD" | "STRONG" | "VERY_STRONG";
} {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

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

  if (!valid) {
    if (!hasMinLength) message += " (min 8 caractères)";
    if (!hasUppercase) message += " (min 1 majuscule)";
    if (!hasNumber) message += " (min 1 chiffre)";
    if (!hasSpecialChar) message += " (min 1 caractère spécial)";
  }

  return { valid, message, strength };
}

export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case "VERY_WEAK": return "#dc2626";
    case "WEAK": return "#f97316";
    case "FAIR": return "#eab308";
    case "GOOD": return "#84cc16";
    case "STRONG": return "#22c55e";
    case "VERY_STRONG": return "#059669";
    default: return "#6b7280";
  }
}

// ============================================
// 📸 PHOTO DE PROFIL
// ============================================

export async function updateProfilePhoto(
  userId: number,
  photoPath: string
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { photo: photoPath },
    select: { id: true }
  });
  await updateProfileCompletion(userId);
}

export async function deleteProfilePhoto(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { photo: null }
  });
  await updateProfileCompletion(userId);
}

// ============================================
// 👥 RECHERCHE UTILISATEUR
// ============================================

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

export async function getUserStats(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  const [enrollments, quizzes] = await Promise.all([
    db.enrollment.findMany({
      where: { studentId: userId },
      select: { progress: true }
    }),
    db.quizResult.findMany({
      where: { studentId: userId },
      select: { score: true }
    })
  ]);

  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  const averageScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.length)
    : 0;

  return {
    profileCompletion: user.pourcentageCompletion,
    coursesEnrolled: enrollments.length,
    coursesCompleted: enrollments.filter((e) => e.progress === 100).length,
    averageProgress,
    quizzesTaken: quizzes.length,
    averageScore,
    lastActive: user.lastLoginAt,
    profileStatus: user.statutProfil
  };
}

// ============================================
// 📊 MISE À JOUR DE PROFIL
// ============================================

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
  await updateProfileCompletion(userId);
}

export async function recordLogin(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      active: true
    }
  });
}

export async function deleteUserSoftly(userId: number): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      active: false
    }
  });
}

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

export function formatFullName(user: {
  prenom: string | null;
  nom: string | null;
}): string {
  return `${user.prenom || ""} ${user.nom || ""}`.trim();
}

export function getInitials(user: {
  prenom: string | null;
  nom: string | null;
}): string {
  const prenomFirst = user.prenom ? user.prenom[0] : "";
  const nomFirst = user.nom ? user.nom[0] : "";
  return `${prenomFirst}${nomFirst}`.toUpperCase();
}

export const niveauScolaireLabels: Record<NiveauScolaire, string> = {
  [NiveauScolaire.PRIMAIRE]: "Primaire",
  [NiveauScolaire.CEM]: "CEM",
  [NiveauScolaire.LYCEE]: "Lycée",
  [NiveauScolaire.BAC]: "Baccalauréat",
  [NiveauScolaire.LICENCE]: "Licence",
  [NiveauScolaire.MASTER]: "Master",
  [NiveauScolaire.DOCTORAT]: "Doctorat"
};

export const roleLabels: Record<Role, string> = {
  [Role.STUDENT]: "Étudiant",
  [Role.TEACHER]: "Enseignant",
  [Role.DESIGNER]: "Concepteur",
  [Role.ADMIN]: "Administrateur"
};

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