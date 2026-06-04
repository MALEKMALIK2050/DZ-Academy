import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "TEACHER" && user.role !== "DESIGNER")
    return res.status(403).json({ error: "Accès refusé" });

  if (req.method === "GET") {
    try {

            // Récupérer le profil complet du teacher
            const teacher = await prisma.user.findUnique({
              where: { id: user.id },
              select: { matieres: true, niveaux: true, classe: true },
            });

            // Cours assignés OU correspondant à matière/niveau/année
            const courses = await prisma.course.findMany({
              where: {
                OR: [
                  { teachers: { some: { id: parseInt(user.id) } } }, // ✅ assigné par admin (multi-teachers)
                  {                        // ✅ correspond à matière + niveau + année
                    status:  "PUBLISHED",
                    matiere: { in: teacher.matieres },
                    niveau:  { in: teacher.niveaux },
                    ...(teacher.classe && { annee: teacher.classe }), // ✅ année si renseignée
                  },
                ],
              },
              include: {
                designer:    { select: { id: true, nom: true, prenom: true } },
                chapters:    { select: { id: true, title: true, ordre: true } },
                enrollments: {
                  include: {
                    student: { select: { id: true, nom: true, prenom: true, classe: true, niveau: true } },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            });

      return res.status(200).json(courses);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}