import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/mail";

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

  const { id } = req.query;

  try {
    // GET — détail devoir + rendus
    if (req.method === "GET") {
      const devoir = await prisma.devoir.findUnique({
        where: { id: parseInt(id) },
        include: {
          rendus: {
            include: {
              student: { select: { id: true, nom: true, prenom: true, classe: true, niveau: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!devoir) return res.status(404).json({ error: "Devoir introuvable" });
      return res.status(200).json(devoir);
    }

    // PATCH — noter un rendu (TEACHER uniquement)
    if (req.method === "PATCH") {
      if (user.role !== "TEACHER" && user.role !== "DESIGNER")
        return res.status(403).json({ error: "Accès refusé" });

      const { renduId, note, feedback } = req.body;
      if (!renduId) return res.status(400).json({ error: "renduId manquant" });

      // Vérifier deadline dépassée
      const devoir = await prisma.devoir.findUnique({ where: { id: parseInt(id) } });
      const now    = new Date();
      const deadline = new Date(devoir.dateLimit);
      deadline.setHours(0, 0, 0, 0);

      if (now < deadline) {
        return res.status(403).json({ error: "La date limite n'est pas encore atteinte — notation impossible avant le deadline" });
      }

      if (note !== undefined && (note < 0 || note > 20)) {
        return res.status(400).json({ error: "La note doit être entre 0 et 20" });
      }

      const updated = await prisma.devoirRendu.update({
        where: { id: parseInt(renduId) },
        data: {
          ...(note     !== undefined && { note: parseFloat(note) }),
          ...(feedback !== undefined && { feedback }),
        },
        include: { 
          student: { select: { email: true, prenom: true } },
          devoir: { select: { titre: true } }
        }
      });

      // ✅ Étape 5 : Notification de retour (Correction de devoir)
      if (note !== undefined || feedback !== undefined) {
        await sendEmail({
          to: updated.student.email,
          subject: `Correction de votre devoir : ${updated.devoir.titre}`,
          html: `
            <h1>Votre devoir a été corrigé</h1>
            <p>Bonjour ${updated.student.prenom},</p>
            <p>Votre rendu pour le devoir <strong>"${updated.devoir.titre}"</strong> a été corrigé.</p>
            ${note !== undefined ? `<p>Note : <strong>${note}/20</strong></p>` : ""}
            ${feedback ? `<p>Commentaire du formateur : <em>"${feedback}"</em></p>` : ""}
            <p>Consultez votre espace élève pour plus de détails.</p>
          `,
        });
      }

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API DEVOIR [id] ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}