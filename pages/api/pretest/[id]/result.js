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
  if (req.method !== 'GET') return res.status(405).json({ error: 'الطريقة غير مسموح بها' });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'غير مصادَق عليه' });

  const { courseId } = req.query;

  if (!courseId) return res.status(400).json({ error: 'courseId مطلوب' });

  try {
    const result = await prisma.pretestResult.findFirst({
      where: { 
        courseId: parseInt(courseId),
        studentId: parseInt(user.id)
      },
      include: {
        course: true
      }
    });

    if (!result) {
      return res.status(200).json(null);
    }

    const total = result.total || 1;
    let percentage = result.pourcentage;
    // Check if percentage was missing or improperly saved (e.g. if score was saved as percentage > total)
    if (percentage === undefined || percentage === null) {
      percentage = result.score <= total ? (result.score / total) * 100 : result.score;
    }
    percentage = Math.round(percentage);

    const feedback = getFeedbackByScore(percentage, 100, result.course?.annee);

    return res.status(200).json({ 
      ...result, 
      correct: result.score <= total ? result.score : Math.round((percentage / 100) * total),
      pourcentage: percentage,
      percentage: percentage,
      feedback 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
