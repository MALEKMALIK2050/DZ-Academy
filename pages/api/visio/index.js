import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";

export default async function handler(req, res) {
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  // Récupérer l'utilisateur complet depuis la base
  const currentUser = await prisma.user.findUnique({
    where: { id: parseInt(decoded.id) },
    select: { id: true, role: true, email: true, nom: true, prenom: true, niveau: true, annee: true },
  });

  if (!currentUser) {
    return res.status(401).json({ error: "المستخدم غير موجود" });
  }

  // ==========================================
  // GET: Récupérer les visioconférences
  // ==========================================
  if (req.method === "GET") {
    try {
      const { filter } = req.query;
      const now = new Date();

      let whereClause = {};

      // Filtrage par audience / rôle
      if (currentUser.role === "ADMIN") {
        whereClause = {};
      } else if (currentUser.role === "DESIGNER") {
        whereClause = {
          OR: [
            { organisateurId: currentUser.id },
            { publicCible: "TOUS" },
            { publicCible: "DESIGNERS" },
            { targetRoles: { has: "DESIGNER" } },
          ],
        };
      } else if (currentUser.role === "TEACHER") {
        whereClause = {
          OR: [
            { organisateurId: currentUser.id },
            { publicCible: "TOUS" },
            { publicCible: "ENSEIGNANTS" },
            { targetRoles: { has: "TEACHER" } },
            { participants: { some: { userId: currentUser.id } } },
          ],
        };
      } else if (currentUser.role === "STUDENT") {
        const studentConditions = [
          { publicCible: "TOUS" },
          { publicCible: "ETUDIANTS" },
          { targetRoles: { has: "STUDENT" } },
          { participants: { some: { userId: currentUser.id } } },
        ];

        if (currentUser.niveau) {
          studentConditions.push({ niveau: currentUser.niveau });
        }

        whereClause = { OR: studentConditions };
      }

      // Filtre temporel / statut additionnel
      if (filter === "live") {
        whereClause.statut = "EN_COURS";
      } else if (filter === "upcoming") {
        whereClause.statut = { in: ["PROGRAMMEE", "EN_COURS"] };
        whereClause.dateDebut = { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) };
      } else if (filter === "past") {
        whereClause.OR = [
          { statut: "TERMINEE" },
          { statut: "ANNULEE" },
          { dateDebut: { lt: new Date(now.getTime() - 4 * 60 * 60 * 1000) } },
        ];
      }

      const visios = await prisma.visioConference.findMany({
        where: whereClause,
        include: {
          organisateur: {
            select: { id: true, nom: true, prenom: true, email: true, role: true, photo: true },
          },
          course: {
            select: { id: true, title: true, matiere: true, niveau: true },
          },
          participants: {
            select: { id: true, userId: true, statut: true },
          },
          _count: {
            select: { participants: true },
          },
        },
        orderBy: [
          { statut: "asc" },
          { dateDebut: "asc" },
        ],
      });

      return res.status(200).json(visios);
    } catch (error) {
      console.error("GET /api/visio error:", error);
      return res.status(500).json({ error: "خطأ في الخادم أثناء جلب الاجتماعات" });
    }
  }

  // ==========================================
  // POST: Créer / Programmer une visio
  // ==========================================
  if (req.method === "POST") {
    const allowedRoles = ["ADMIN", "DESIGNER", "TEACHER"];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({ error: "المديرون والمصممون والأساتذة فقط يمكنهم برمجة اجتماع عبر الفيديو. الطلاب يمكنهم المشاركة فقط." });
    }

    try {
      const {
        titre,
        description,
        dateDebut,
        dureeMinutes = 60,
        publicCible = "TOUS",
        targetRoles = [],
        niveau = null,
        annee = null,
        matiere = null,
        courseId = null,
        demarrerImmediatement = false,
      } = req.body;

      if (!titre || !titre.trim()) {
        return res.status(400).json({ error: "عنوان الاجتماع مطلوب" });
      }

      let parsedDateDebut = dateDebut ? new Date(dateDebut) : new Date();
      if (isNaN(parsedDateDebut.getTime())) {
        parsedDateDebut = new Date();
      }

      const statut = demarrerImmediatement ? "EN_COURS" : "PROGRAMMEE";
      if (demarrerImmediatement) {
        parsedDateDebut = new Date();
      }

      const cleanSlug = titre
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 24);
      const uniqueSuffix = Math.random().toString(36).substring(2, 7) + "-" + Date.now().toString().slice(-4);
      const roomName = `dz-${cleanSlug || "session"}-${uniqueSuffix}`;

      let finalTargetRoles = Array.isArray(targetRoles) ? [...targetRoles] : [];
      if (publicCible === "TOUS") {
        finalTargetRoles = ["ADMIN", "DESIGNER", "TEACHER", "STUDENT"];
      } else if (publicCible === "ENSEIGNANTS") {
        finalTargetRoles = ["TEACHER"];
      } else if (publicCible === "ETUDIANTS") {
        finalTargetRoles = ["STUDENT"];
      } else if (publicCible === "DESIGNERS") {
        finalTargetRoles = ["DESIGNER"];
      }

      // 1. Créer la visioconférence
      const visio = await prisma.visioConference.create({
        data: {
          titre: titre.trim(),
          description: description?.trim() || null,
          dateDebut: parsedDateDebut,
          dureeMinutes: parseInt(dureeMinutes) || 60,
          roomName,
          statut,
          publicCible,
          targetRoles: finalTargetRoles,
          niveau: niveau || null,
          annee: annee || null,
          matiere: matiere || null,
          courseId: courseId ? parseInt(courseId) : null,
          organisateurId: currentUser.id,
        },
        include: {
          organisateur: {
            select: { id: true, nom: true, prenom: true, email: true, role: true },
          },
        },
      });

      // 2. Trouver les utilisateurs ciblés pour les notifications
      let userQuery = {
        active: true,
        id: { not: currentUser.id },
      };

      if (publicCible === "ENSEIGNANTS") {
        userQuery.role = "TEACHER";
      } else if (publicCible === "ETUDIANTS") {
        userQuery.role = "STUDENT";
        if (niveau) userQuery.niveau = niveau;
        if (annee) userQuery.annee = annee;
      } else if (publicCible === "DESIGNERS") {
        userQuery.role = "DESIGNER";
      } else if (publicCible !== "TOUS" && finalTargetRoles.length > 0) {
        userQuery.role = { in: finalTargetRoles };
      }

      let targetUserIds = [];
      if (courseId) {
        const enrollments = await prisma.enrollment.findMany({
          where: { courseId: parseInt(courseId) },
          select: { studentId: true },
        });
        targetUserIds = enrollments.map((e) => e.studentId);
      }

      const targetUsers = await prisma.user.findMany({
        where: courseId
          ? { OR: [userQuery, { id: { in: targetUserIds } }] }
          : userQuery,
        select: { id: true, email: true, prenom: true, nom: true },
      });

      // 3. Créer les participants
      if (targetUsers.length > 0) {
        const participantsData = targetUsers.map((u) => ({
          visioId: visio.id,
          userId: u.id,
          statut: "INVITE",
        }));

        await prisma.visioParticipant.createMany({
          data: participantsData,
          skipDuplicates: true,
        });

        // 4. Créer les notifications dans l'application
        const formattedDate = parsedDateDebut.toLocaleDateString("ar-DZ", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const formattedTime = parsedDateDebut.toLocaleTimeString("ar-DZ", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const notifTitre = demarrerImmediatement
          ? `📹 اجتماع مباشر: ${visio.titre}`
          : `📅 دعوة اجتماع: ${visio.titre}`;

        const notifMsg = demarrerImmediatement
          ? `${currentUser.prenom} ${currentUser.nom} بدأ اجتماعاً عبر الفيديو حول: "${visio.titre}". انضم الآن!`
          : `أنت مدعو(ة) لاجتماع الفيديو "${visio.titre}" يوم ${formattedDate} الساعة ${formattedTime}. المنظم: ${currentUser.prenom} ${currentUser.nom}.`;

        const notificationsData = targetUsers.map((u) => ({
          userId: u.id,
          type: "VISIO",
          titre: notifTitre,
          message: notifMsg,
          lien: `/visio?id=${visio.id}`,
          contenu: notifMsg,
          lu: false,
          updatedAt: new Date(),
        }));

        await prisma.notification.createMany({
          data: notificationsData,
        });

        // 5. Envoi des invitations par email
        try {
          const baseUrl = process.env.NEXTAUTH_URL || (req.headers.origin || "http://localhost:3000");
          const meetingUrl = `${baseUrl}/visio?id=${visio.id}`;

          Promise.allSettled(
            targetUsers
              .filter((u) => u.email)
              .map((u) =>
                sendEmail({
                  to: u.email,
                  subject: `📅 دعوة اجتماع فيديو: ${visio.titre} - دزأكاديمي`,
                  html: `
                    <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                      <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 25px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">📹 اجتماع فيديو دزأكاديمي</h1>
                        <p style="margin: 8px 0 0; color: #fef3c7; font-size: 14px;">دعوة لحصة مباشرة عبر الإنترنت</p>
                      </div>
                      <div style="padding: 25px; color: #1e293b;">
                        <p style="font-size: 16px;">مرحباً <strong>${u.prenom} ${u.nom}</strong>،</p>
                        <p style="font-size: 15px; line-height: 1.6;">
                          ${demarrerImmediatement 
                            ? `<strong>${currentUser.prenom} ${currentUser.nom}</strong> بدأ اجتماعاً تفاعلياً عبر الفيديو.`
                            : `أنت مدعو(ة) للاجتماع التالي عبر الفيديو:`}
                        </p>
                        <div style="background: #f8fafc; border-right: 4px solid #f97316; padding: 15px; border-radius: 8px; margin: 20px 0;">
                          <h2 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">${visio.titre}</h2>
                          ${visio.description ? `<p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">${visio.description}</p>` : ''}
                          <p style="margin: 5px 0; font-size: 14px;"><strong>📅 التاريخ:</strong> ${formattedDate}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>🕐 الساعة:</strong> ${formattedTime}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>⏱️ المدة:</strong> ${visio.dureeMinutes} دقيقة</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>👤 المنظم:</strong> ${currentUser.prenom} ${currentUser.nom}</p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${meetingUrl}" style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                            ${demarrerImmediatement ? "📹 انضم للحصة المباشرة" : "📅 الدخول للاجتماع"}
                          </a>
                        </div>
                        <p style="font-size: 13px; color: #94a3b8; text-align: center;">
                          الرابط المباشر: <a href="${meetingUrl}" style="color: #f97316;">${meetingUrl}</a>
                        </p>
                      </div>
                      <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                        © ${new Date().getFullYear()} دزأكاديمي — منصة التعلم الإلكتروني
                      </div>
                    </div>
                  `,
                })
              )
          ).catch((e) => console.error("خطأ إرسال البريد:", e));
        } catch (mailErr) {
          console.error("خطأ تهيئة البريد:", mailErr);
        }
      }

      return res.status(201).json({
        visio,
        participantsInvites: targetUsers.length,
        message: "تمت برمجة الاجتماع بنجاح وإرسال الدعوات!",
      });
    } catch (error) {
      console.error("POST /api/visio error:", error);
      return res.status(500).json({ error: error.message || "خطأ في الخادم أثناء إنشاء الاجتماع" });
    }
  }

  return res.status(405).json({ error: "طريقة غير مسموحة" });
}
