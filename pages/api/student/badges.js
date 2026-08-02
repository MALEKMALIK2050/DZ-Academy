import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { seedBadges, calculateLevel } from "@/lib/badges";

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  await seedBadges();

  if (req.method === "GET") {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true, pourcentageCompletion: true },
      });

      if (!dbUser) {
        return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      const xp = dbUser.xp || 0;
      const levelStats = calculateLevel(xp);

      const allBadges = await prisma.badge.findMany({
        orderBy: { points: "asc" },
      });

      const userBadges = await prisma.userBadge.findMany({
        where: { userId: user.id },
      });

      const userBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
      const userBadgeDates = {};
      userBadges.forEach((ub) => {
        userBadgeDates[ub.badgeId] = ub.earnedAt;
      });

      const badgesList = allBadges.map((badge) => {
        const earned = userBadgeIds.has(badge.id);
        return {
          id: badge.id,
          code: badge.code,
          title: badge.title,
          description: badge.description,
          icon: badge.icon,
          points: badge.points,
          earned,
          earnedAt: earned ? userBadgeDates[badge.id] : null,
        };
      });

      const totalBadgesCount = allBadges.length;
      const earnedBadgesCount = userBadges.length;

      return res.status(200).json({
        xp,
        levelStats,
        badges: badgesList,
        totalBadgesCount,
        earnedBadgesCount,
        profileCompletion: dbUser.pourcentageCompletion || 0,
      });
    } catch (error) {
      console.error("Error in GET /api/student/badges:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
