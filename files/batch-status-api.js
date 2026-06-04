import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUser(req) {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });
  if (user.role !== "DESIGNER") return res.status(403).json({ error: "Accès refusé" });

  try {
    if (req.method === "GET") {
      const { batchId } = req.query;

      if (!batchId) {
        return res.status(400).json({ error: "batchId manquant" });
      }

      const batch = await prisma.importBatch.findUnique({
        where: { id: parseInt(batchId) },
        include: {
          course: { select: { id: true, titre: true } },
        },
      });

      if (!batch) {
        return res.status(404).json({ error: "Batch non trouvé" });
      }

      return res.status(200).json({
        batchId: batch.id,
        courseId: batch.courseId,
        courseName: batch.course.titre,
        status: batch.status,
        modules: {
          chapters: {
            status: batch.chaptersStatus,
            created: batch.chaptersCreated,
            error: batch.chaptersError,
          },
          pretest: {
            status: batch.pretestStatus,
            created: batch.pretestCreated,
            error: batch.pretestError,
          },
          formative: {
            status: batch.formativeStatus,
            created: batch.formativeCreated,
            error: batch.formativeError,
          },
          summative: {
            status: batch.summativeStatus,
            created: batch.summativeCreated,
            error: batch.summativeError,
          },
        },
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
      });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("BATCH STATUS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
