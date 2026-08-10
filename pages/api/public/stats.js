import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [coursesCount, studentsCount, teachersCount] = await Promise.all([
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } })
    ]);

    return res.status(200).json({
      courses: coursesCount,
      students: studentsCount,
      teachers: teachersCount
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
