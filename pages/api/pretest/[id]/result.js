import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getFeedbackByScore } from "@/lib/pretestGenerator";

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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });

  const { courseId } = req.query;

  if (!courseId) return res.status(400).json({ error: 'courseId requis' });

  try {
    const result = await prisma.pretestResult.findFirst({
      where: { 
        courseId: parseInt(courseId),
        studentId: user.id
      },
      include: {
        course: true
      }
    });

    if (!result) {
      return res.status(200).json(null);
    }

    const feedback = getFeedbackByScore(result.score, result.total, result.course?.annee);

    return res.status(200).json({ ...result, feedback });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}