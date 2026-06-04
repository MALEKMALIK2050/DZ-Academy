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

  const { id: courseId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Chercher pretest par courseId
    const pretest = await prisma.pretest.findFirst({
      where: { courseId: parseInt(courseId) },
      include: { questions: true },
    });

    if (!pretest) return res.status(404).json({ error: "Pretest introuvable" });

    return res.status(200).json({
      questions: pretest.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options || [],
      })),
    });
  } catch (error) {
    console.error("API PRETEST ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}