import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
  if (user.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

  try {
    // GET
    if (req.method === "GET") {
      const users = await prisma.user.findMany({
        select: {
          id: true, nom: true, prenom: true, email: true,
          role: true, matieres: true, niveaux: true,
          classe: true, niveau: true, annee: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(users);
    }

    // POST — créer user
    if (req.method === "POST") {
      const { nom, prenom, email, password, role, matieres, niveaux, annee, classe, niveau } = req.body;

      if (!nom || !prenom || !email || !password)
        return res.status(400).json({ error: "Champs obligatoires manquants" });

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: "Email déjà utilisé" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          nom, prenom, email,
          password: hashedPassword,
          role:     role    || "TEACHER",
          matieres: matieres || [],
          niveaux:  niveaux  || [],
          annee:    annee    || null,
          classe:   classe   || null, // ✅ ajouté
          niveau:   niveau   || null, // ✅ ajouté
        },
      });
      return res.status(201).json(newUser);
    }

    // PATCH — modifier rôle / matieres / niveaux / classe
    if (req.method === "PATCH") {
      const { id, role, matieres, niveaux, classe, niveau } = req.body;
      if (!id) return res.status(400).json({ error: "id manquant" });

      const updated = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          ...(role     && { role }),
          ...(matieres && { matieres }),
          ...(niveaux  && { niveaux }),
          ...(classe   !== undefined && { classe }),  // ✅ ajouté
          ...(niveau   !== undefined && { niveau }),  // ✅ ajouté
        },
      });
      return res.status(200).json(updated);
    }

if (req.method === "DELETE") {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID manquant" });

  try {
    const userId = parseInt(id);
    const enrollments = await prisma.enrollment.count({ where: { studentId: userId } });

    if (enrollments > 0) {
      // A payé → désactiver seulement
      await prisma.user.update({
        where: { id: userId },
        data: { active: false }
      });
      return res.status(200).json({ message: "Compte désactivé (étudiant avec enrollments)" });
    } else {
      // Jamais payé → suppression définitive
      await prisma.user.delete({ where: { id: userId } });
      return res.status(200).json({ message: "Utilisateur supprimé" });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
}

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API USERS ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}