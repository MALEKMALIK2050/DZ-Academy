import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token || typeof token !== 'string') return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || typeof decoded === 'string') return null;
    
    return {
      id: typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = getUser(req);
  
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  if (req.method === "GET") {
    try {
      const courses = await prisma.course.findMany({
        where: { status: "PUBLISHED" },
        include: { designer: { select: { nom: true, prenom: true } } },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(courses);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "POST") {
    if (user.role !== "DESIGNER" && user.role !== "TEACHER") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    
    try {
      const { title, description, matiere, niveau, annee } = req.body;
      
      if (!title || !matiere || !niveau || !annee) {
        return res.status(400).json({ error: "Champs obligatoires manquants" });
      }

      const course = await prisma.course.create({
        data: {
          title,
          description: description || "",
          matiere,
          niveau,
          annee,
          designerId: user.id,
          status: "DRAFT",
        },
      });
      
      return res.status(201).json(course);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur création" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}