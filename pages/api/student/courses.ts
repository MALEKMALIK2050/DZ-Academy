import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getUser(req: NextApiRequest) {
  try {
    const token = req.cookies?.token;
    if (!token || typeof token !== 'string') return null;
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUser(req);
  if (!user || typeof user === 'string' || user.role !== "STUDENT") {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const studentId = parseInt(user.id as string, 10);

  try {
    const [catalogue, enrollments] = await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        include: { designer: { select: { nom: true, prenom: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.enrollment.findMany({
        where: { studentId },
        include: { course: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.status(200).json({ catalogue, enrollments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}