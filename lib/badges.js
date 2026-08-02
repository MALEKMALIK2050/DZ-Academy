import prisma from "./prisma";

// Liste des badges par défaut
export const DEFAULT_BADGES = [
  {
    code: "PROFILE_COMPLETED",
    title: "Profil Parfait",
    description: "Remplir toutes les معلومات الشخصية de son profil.",
    icon: "👤",
    points: 50,
  },
  {
    code: "FIRST_QUIZ",
    title: "Premier Pas",
    description: "Compléter et soumettre son tout premier quiz.",
    icon: "✏️",
    points: 20,
  },
  {
    code: "PERFECT_QUIZ",
    title: "Sans Faute",
    description: "Obtenir un score parfait de 100% à un quiz.",
    icon: "🏆",
    points: 50,
  },
  {
    code: "COURSE_COMPLETED",
    title: "Diplômé DZ Academy",
    description: "Terminer un cours à 100% de progression.",
    icon: "🎓",
    points: 100,
  },
  {
    code: "FORUM_POST",
    title: "Esprit d'Équipe",
    description: "Publier son premier message ou réponse sur le forum.",
    icon: "💬",
    points: 30,
  },
  {
    code: "QUIZ_MASTER",
    title: "Érudit",
    description: "Réussir au moins 3 quiz différents.",
    icon: "🔥",
    points: 120,
  },
];

export async function seedBadges() {
  try {
    const count = await prisma.badge.count();
    if (count === 0) {
      console.log("Seeding default badges...");
      for (const badge of DEFAULT_BADGES) {
        await prisma.badge.create({
          data: badge,
        });
      }
    }
  } catch (err) {
    console.error("Error seeding badges:", err);
  }
}

export async function awardBadge(userId, badgeCode) {
  try {
    await seedBadges();

    const badge = await prisma.badge.findUnique({
      where: { code: badgeCode },
    });

    if (!badge) {
      console.error(`Badge not found: ${badgeCode}`);
      return { earned: false };
    }

    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (existing) {
      return { earned: false };
    }

    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: {
          increment: badge.points,
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "BADGE_UNLOCKED",
        titre: "🏆 Badge Débloqué !",
        message: `Félicitations ! Vous avez obtenu le badge "${badge.title}". (+${badge.points} XP)`,
        contenu: JSON.stringify({
          code: badge.code,
          title: badge.title,
          icon: badge.icon,
          points: badge.points,
        }),
      },
    });

    return { earned: true, badge };
  } catch (err) {
    console.error(`Error awarding badge ${badgeCode} to user ${userId}:`, err);
    return { earned: false };
  }
}

export function calculateLevel(xp) {
  let level = 1;
  let nextThreshold = 200;
  let prevThreshold = 0;

  if (xp >= 5000) {
    level = 7;
    prevThreshold = 5000;
    nextThreshold = Infinity;
  } else if (xp >= 3500) {
    level = 6;
    prevThreshold = 3500;
    nextThreshold = 5000;
  } else if (xp >= 2000) {
    level = 5;
    prevThreshold = 2000;
    nextThreshold = 3500;
  } else if (xp >= 1000) {
    level = 4;
    prevThreshold = 1000;
    nextThreshold = 2000;
  } else if (xp >= 500) {
    level = 3;
    prevThreshold = 500;
    nextThreshold = 1000;
  } else if (xp >= 200) {
    level = 2;
    prevThreshold = 200;
    nextThreshold = 500;
  }

  const nextLevelXP = nextThreshold === Infinity ? 0 : nextThreshold - xp;
  const progressPercent =
    nextThreshold === Infinity
      ? 100
      : Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

  let rankName = "مبتدئ (Apprenti)";
  if (level === 2) rankName = "مكتشف (Explorateur)";
  else if (level === 3) rankName = "مرافق (Compagnon)";
  else if (level === 4) rankName = "مختص (Spécialiste)";
  else if (level === 5) rankName = "خبير (Expert)";
  else if (level >= 6) rankName = "أستاذ الأكاديمية (Maître)";

  return {
    level,
    xp,
    prevThreshold,
    nextThreshold,
    nextLevelXP,
    progressPercent,
    rankName,
  };
}
