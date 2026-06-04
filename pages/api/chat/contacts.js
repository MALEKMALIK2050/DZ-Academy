import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

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
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  const userId = parseInt(user.id);

  try {
    let contacts = [];
    let groups   = [];

    // ADMIN, TEACHER, DESIGNER
    if (user.role === "ADMIN" || user.role === "TEACHER" || user.role === "DESIGNER") {
      contacts = await prisma.user.findMany({
        where:   { id: { not: userId } },
        select:  { id: true, nom: true, prenom: true, role: true },
        orderBy: { role: "asc" },
      });

      groups = [
        { id: "TOUS",      label: "📢 Tout le monde",     color: "#3182ce" },
        { id: "TEACHERS",  label: "👨‍🏫 Tous les teachers",  color: "#38a169" },
        { id: "DESIGNERS", label: "🎨 Tous les designers",  color: "#805ad5" },
        { id: "ELEVES",    label: "👨‍🎓 Tous les élèves",    color: "#dd6b20" },
      ];
    }

    // STUDENT
// STUDENT
else if (user.role === "STUDENT") {
  const allTeachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: { id: true, nom: true, prenom: true, role: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId, statut: { in: ["PAYE", "GRATUIT"] } },
    include: {
      course: {
        include: {
          enrollments: {
            where: { statut: { in: ["PAYE", "GRATUIT"] } },
            include: { student: { select: { id: true, nom: true, prenom: true, role: true } } },
          },
        },
      },
    },
  });

  const coEleves = enrollments.flatMap((e) => e.course.enrollments.map((en) => en.student));

  groups = [
    { id: "ELEVES", label: "👨‍🎓 Groupe Élèves", color: "#dd6b20" },
  ];

  const allContacts = [...allTeachers, ...coEleves];
  const seen = new Set();
  contacts = allContacts.filter((c) => {
    if (!c || seen.has(c.id)) return false;
    seen.add(c.id);
    return c.id !== userId;
  });
}

// Ajouter le compte de messages non lus pour chaque contact
for (let contact of contacts) {
  const unreadCount = await prisma.message.count({
    where: {
      receiverId: userId,
      senderId: contact.id,
      lu: false,
    },
  });
  contact.unreadCount = unreadCount;
}

return res.status(200).json({ contacts, groups });

  } catch (error) {
    console.error("API CHAT CONTACTS ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}