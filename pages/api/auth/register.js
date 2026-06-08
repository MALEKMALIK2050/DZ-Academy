import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/mail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const { nom, prenom, email, password, role, niveau, classe, anneeScolaire, tuteur } = body;

    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        password: hashedPassword,
        role: role?.toUpperCase() || "STUDENT",
        niveau,
        classe,
        annee: anneeScolaire || null,
        tuteurNom:       tuteur?.nom       || "",
        tuteurPrenom:    tuteur?.prenom    || "",
        tuteurTelephone: tuteur?.telephone || "",
        active: false, // ← compte inactif jusqu'à validation admin
      },
    });

    // ── Email 1 : Bienvenue à l'étudiant (sans mot de passe) ──
    await sendEmail({
      to: user.email,
      subject: "🎓 Bienvenue sur CBA Academy — Votre compte est en cours de validation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #f8fafc; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 2rem;">
            <h1 style="color: white; margin: 0; font-size: 1.8rem;">🎓 CBA Academy</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0;">Cheikh Bouamama Academy</p>
          </div>

          <h2 style="color: #1e293b;">Bonjour ${prenom} ${nom},</h2>
          <p style="color: #475569; line-height: 1.7;">
            Votre compte a bien été créé sur <strong>CBA Academy</strong>. 
            Votre inscription est en cours de validation par notre équipe.
          </p>

          <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
              ⏳ Votre compte sera activé sous 24h après vérification par l'administration.
            </p>
          </div>

          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
            <h3 style="margin: 0 0 1rem; color: #1e293b;">📋 Récapitulatif de votre inscription</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 0.5rem 0; color: #64748b;">Nom complet</td><td style="font-weight: 600; color: #1e293b;">${prenom} ${nom}</td></tr>
              <tr><td style="padding: 0.5rem 0; color: #64748b;">Email</td><td style="font-weight: 600; color: #1e293b;">${email}</td></tr>
              ${niveau ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Niveau</td><td style="font-weight: 600; color: #1e293b;">${niveau}</td></tr>` : ""}
              ${classe ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Classe</td><td style="font-weight: 600; color: #1e293b;">${classe}</td></tr>` : ""}
            </table>
          </div>

          <p style="color: #475569;">
            Vous recevrez un email de confirmation dès que votre compte sera activé.
          </p>

          <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 0.85rem;">
              CBA Academy — Cheikh Bouamama Academy<br/>
              Pour toute question, contactez-nous à <a href="mailto:contact@cb-academy.dz" style="color: #059669;">contact@cb-academy.dz</a>
            </p>
          </div>
        </div>
      `,
    });

    // ── Email 2 : Notification à l'admin ──
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { email: true, prenom: true },
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `🆕 Nouvel étudiant inscrit : ${prenom} ${nom}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #f8fafc; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 1.5rem 2rem; border-radius: 12px; margin-bottom: 2rem;">
              <h1 style="color: white; margin: 0; font-size: 1.4rem;">👑 CBA Academy — Administration</h1>
            </div>

            <h2 style="color: #1e293b;">Bonjour ${admin.prenom},</h2>
            <p style="color: #475569;">Un nouvel étudiant vient de s'inscrire sur la plateforme et attend votre validation.</p>

            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="margin: 0 0 1rem; color: #1e293b;">👤 Informations de l'étudiant</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 0.5rem 0; color: #64748b;">Nom complet</td><td style="font-weight: 600; color: #1e293b;">${prenom} ${nom}</td></tr>
                <tr><td style="padding: 0.5rem 0; color: #64748b;">Email</td><td style="font-weight: 600; color: #1e293b;">${email}</td></tr>
                ${niveau ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Niveau</td><td style="font-weight: 600; color: #1e293b;">${niveau}</td></tr>` : ""}
                ${classe ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Classe</td><td style="font-weight: 600; color: #1e293b;">${classe}</td></tr>` : ""}
                ${tuteur?.nom ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Tuteur</td><td style="font-weight: 600; color: #1e293b;">${tuteur.prenom} ${tuteur.nom} — ${tuteur.telephone}</td></tr>` : ""}
              </table>
            </div>

            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || "https://cb-academy-dz.vercel.app"}/dashboard/admin?tab=users" 
                 style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 0.85rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">
                ✅ Valider le compte
              </a>
            </div>

            <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 0.85rem;">CBA Academy — Tableau de bord administrateur</p>
            </div>
          </div>
        `,
      });
    }

    // ── Notification interne admin ──
    for (const admin of admins) {
      const adminUser = await prisma.user.findUnique({ where: { email: admin.email }, select: { id: true } });
      if (adminUser) {
        await prisma.notification.create({
          data: {
            userId:  adminUser.id,
            type:    "NOUVEL_INSCRIT",
            contenu: `Nouvel étudiant inscrit : ${prenom} ${nom} (${email}) — en attente de validation`,
            lu:      false,
          },
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);

    return res.status(201).json({
      message: "Compte créé avec succès. En attente de validation par l'administrateur.",
      user: { id: user.id, role: user.role, email: user.email },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
}