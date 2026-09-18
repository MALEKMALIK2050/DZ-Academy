import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export default async function handler(req, res) {
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: parseInt(decoded.id) },
    select: { id: true, role: true, nom: true, prenom: true, email: true },
  });

  if (!currentUser) {
    return res.status(401).json({ error: "المستخدم غير موجود" });
  }

  const { id } = req.query;
  const visioId = parseInt(id);

  if (isNaN(visioId)) {
    return res.status(400).json({ error: "معرف غير صالح" });
  }

  // ==========================================
  // GET: Détails d'une visioconférence
  // ==========================================
  if (req.method === "GET") {
    try {
      const visio = await prisma.visioConference.findUnique({
        where: { id: visioId },
        include: {
          organisateur: {
            select: { id: true, nom: true, prenom: true, email: true, role: true, photo: true },
          },
          course: {
            select: { id: true, title: true, matiere: true, niveau: true },
          },
          participants: {
            include: {
              user: {
                select: { id: true, nom: true, prenom: true, email: true, role: true, photo: true },
              },
            },
          },
          _count: {
            select: { participants: true },
          },
        },
      });

      if (!visio) {
        return res.status(404).json({ error: "الاجتماع غير موجود" });
      }

      // Si join=true, marquer la présence du participant
      if (req.query.join === "true") {
        try {
          await prisma.visioParticipant.upsert({
            where: {
              visioId_userId: {
                visioId: visio.id,
                userId: currentUser.id,
              },
            },
            update: {
              statut: "REJOINT",
              rejointAt: new Date(),
            },
            create: {
              visioId: visio.id,
              userId: currentUser.id,
              statut: "REJOINT",
              rejointAt: new Date(),
            },
          });
        } catch (joinErr) {
          console.error("Erreur marquage présence:", joinErr);
        }

        // Passer automatiquement en EN_COURS si l'organisateur rejoint
        if (
          visio.statut === "PROGRAMMEE" &&
          (currentUser.id === visio.organisateurId || currentUser.role === "ADMIN")
        ) {
          try {
            await prisma.visioConference.update({
              where: { id: visio.id },
              data: { statut: "EN_COURS" },
            });
            visio.statut = "EN_COURS";
          } catch (statusErr) {
            console.error("Erreur changement statut:", statusErr);
          }
        }

        // Re-fetch avec participants mis à jour
        const updatedVisio = await prisma.visioConference.findUnique({
          where: { id: visioId },
          include: {
            organisateur: {
              select: { id: true, nom: true, prenom: true, email: true, role: true, photo: true },
            },
            course: {
              select: { id: true, title: true, matiere: true, niveau: true },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, nom: true, prenom: true, email: true, role: true, photo: true },
                },
              },
            },
            _count: {
              select: { participants: true },
            },
          },
        });

        return res.status(200).json(updatedVisio);
      }

      return res.status(200).json(visio);
    } catch (error) {
      console.error("GET /api/visio/[id] error:", error);
      return res.status(500).json({ error: "خطأ في الخادم" });
    }
  }

  // ==========================================
  // PATCH: Modifier le statut d'une visio
  // ==========================================
  if (req.method === "PATCH") {
    try {
      const visio = await prisma.visioConference.findUnique({
        where: { id: visioId },
        select: { id: true, organisateurId: true, statut: true },
      });

      if (!visio) {
        return res.status(404).json({ error: "الاجتماع غير موجود" });
      }

      // Seul l'organisateur ou un admin peut modifier
      if (currentUser.id !== visio.organisateurId && currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "ليس لديك صلاحية تعديل هذا الاجتماع" });
      }

      const { statut } = req.body;
      const validStatuts = ["PROGRAMMEE", "EN_COURS", "TERMINEE", "ANNULEE"];

      if (!statut || !validStatuts.includes(statut)) {
        return res.status(400).json({ error: "حالة غير صالحة" });
      }

      const updated = await prisma.visioConference.update({
        where: { id: visioId },
        data: { statut },
        include: {
          organisateur: {
            select: { id: true, nom: true, prenom: true, email: true, role: true },
          },
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("PATCH /api/visio/[id] error:", error);
      return res.status(500).json({ error: "خطأ في تحديث الاجتماع" });
    }
  }

  // ==========================================
  // DELETE: Supprimer une visio
  // ==========================================
  if (req.method === "DELETE") {
    try {
      const visio = await prisma.visioConference.findUnique({
        where: { id: visioId },
        select: { id: true, organisateurId: true, titre: true },
      });

      if (!visio) {
        return res.status(404).json({ error: "الاجتماع غير موجود" });
      }

      // Seul l'organisateur ou un admin peut supprimer
      if (currentUser.id !== visio.organisateurId && currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "ليس لديك صلاحية حذف هذا الاجتماع" });
      }

      await prisma.visioConference.delete({
        where: { id: visioId },
      });

      return res.status(200).json({ message: `تم حذف الاجتماع "${visio.titre}" بنجاح` });
    } catch (error) {
      console.error("DELETE /api/visio/[id] error:", error);
      return res.status(500).json({ error: "خطأ في حذف الاجتماع" });
    }
  }

  return res.status(405).json({ error: "طريقة غير مسموحة" });
}
