import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch { return null; }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  try {
    // GET — liste tous les cours (ADMIN)
    if (req.method === "GET") {
      if (user.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

      const courses = await prisma.course.findMany({
        include: {
          designer:    { select: { id: true, nom: true, prenom: true } },
          teachers:    { select: { id: true, nom: true, prenom: true } },
          enrollments: { select: { id: true } },
          chapters:    { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(courses);
    }

    // POST — créer un cours (DESIGNER)
    if (req.method === "POST") {
      if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

      const { title, description, objectifs, matiere, niveau, annee } = req.body;
      if (!title) return res.status(400).json({ error: "Titre obligatoire" });

      const course = await prisma.course.create({
        data: {
          title,
          description: description || null,
          objectifs:   objectifs   || null,
          matiere:     matiere     || null,
          niveau:      niveau      || null,
          annee:       annee       || null,
          designerId:  parseInt(user.id),    // ✅ lié au designer connecté
        },
      });
      return res.status(201).json(course);
    }

    // PUT — affecter teacher (ADMIN)
    if (req.method === "PUT") {
      if (user.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

      const { courseId, teacherId } = req.body;
      if (!courseId) return res.status(400).json({ error: "courseId manquant" });

      const updated = await prisma.course.update({
        where: { id: parseInt(courseId) },
        data:  { 
          teachers: {
            set: teacherId ? [{ id: parseInt(teacherId) }] : []
          }
        },
      });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API COURSES ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
}