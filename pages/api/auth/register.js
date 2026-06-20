// ======================================================
// FICHIER : pages/api/auth/register.js
// ======================================================
// MODIFICATIONS : Ajout des champs politiques dans la création utilisateur
//                 et ajout de la constante POLICY_VERSION

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";

// ✅ NOUVEAU : Version des politiques
const POLICY_VERSION = '2026-06-20_v1';

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

    // Générer un token de vérification unique
    const verificationToken = crypto.randomBytes(32).toString("hex");

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
        active: false, // inactif jusqu'à vérification email
        verificationToken,
        // ✅ AJOUT - Consentements aux politiques
        cguAccepted: true,  // L'utilisateur accepte en s'inscrivant
        cguAcceptedAt: new Date(),
        cguVersion: POLICY_VERSION,
        prereqAccepted: true,
        prereqAcceptedAt: new Date(),
        prereqVersion: POLICY_VERSION,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://cb-academy-dz.vercel.app";
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // ── Email étudiant avec lien de vérification ──
    await sendEmail({
      to: user.email,
      subject: "🎓 Activez votre compte CBA Academy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #f8fafc; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 2rem;">
            <h1 style="color: white; margin: 0; font-size: 1.8rem;">🎓 CBA Academy</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0;">Cheikh Bouamama Academy</p>
          </div>

          <h2 style="color: #1e293b;">Bonjour ${prenom} ${nom},</h2>
          <p style="color: #475569; line-height: 1.7;">
            Votre compte a été créé avec succès. Cliquez sur le bouton ci-dessous pour activer votre compte.
          </p>

          <div style="text-align: center; margin: 2rem 0; background: #f0fdf4; padding: 1.5rem; border-radius: 8px;">
            <p style="color: #1e293b; margin: 0 0 1rem; font-size: 0.9rem;">Cliquez sur le lien ci-dessous pour activer votre compte :</p>
            <a href="${verificationLink}" 
               style="background-color: #16a34a; color: #ffffff !important; padding: 1rem 2.5rem; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem; display: inline-block; font-family: Arial, sans-serif;">
              Activer mon compte
            </a>
            <p style="color: #64748b; margin: 1rem 0 0; font-size: 0.8rem;">
              Ou copiez ce lien dans votre navigateur :<br/>
              <span style="color: #16a34a; word-break: break-all;">${verificationLink}</span>
            </p>
          </div>

          <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
            <p style="margin: 0; color: #92400e; font-size: 0.9rem;">
              ⚠️ Ce lien est valable 24h. Si vous n'avez pas créé ce compte, ignorez cet email.
            </p>
          </div>

          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
            <h3 style="margin: 0 0 1rem; color: #1e293b;">📋 Récapitulatif</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 0.5rem 0; color: #64748b;">Nom complet</td><td style="font-weight: 600; color: #1e293b;">${prenom} ${nom}</td></tr>
              <tr><td style="padding: 0.5rem 0; color: #64748b;">Email</td><td style="font-weight: 600; color: #1e293b;">${email}</td></tr>
              ${niveau ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Niveau</td><td style="font-weight: 600; color: #1e293b;">${niveau}</td></tr>` : ""}
              ${classe ? `<tr><td style="padding: 0.5rem 0; color: #64748b;">Classe</td><td style="font-weight: 600; color: #1e293b;">${classe}</td></tr>` : ""}
            </table>
          </div>

          <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 0.85rem;">
              CB Academy — Cheikh Bouamama Academy<br/>
              <a href="mailto:${process.env.SMTP_FROM_EMAIL}" style="color: #059669;">${process.env.SMTP_FROM_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
    });

    // ── Notification admin ──
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { id: true, email: true, prenom: true },
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `🆕 Nouvel étudiant inscrit : ${prenom} ${nom}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <h2 style="color: #1e293b;">Bonjour ${admin.prenom},</h2>
            <p>Un nouvel étudiant vient de s'inscrire :</p>
            <ul>
              <li><strong>Nom :</strong> ${prenom} ${nom}</li>
              <li><strong>Email :</strong> ${email}</li>
              ${niveau ? `<li><strong>Niveau :</strong> ${niveau}</li>` : ""}
              ${classe ? `<li><strong>Classe :</strong> ${classe}</li>` : ""}
            </ul>
            <p>Il activera son compte via le lien envoyé par email.</p>
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${baseUrl}/dashboard/admin?tab=users" 
                 style="background: #1e40af; color: white; padding: 0.85rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">
                👑 Voir les utilisateurs
              </a>
            </div>
          </div>
        `,
      });

      await prisma.notification.create({
        data: {
          userId:  admin.id,
          type:    "NOUVEL_INSCRIT",
          titre:   "Nouvel étudiant inscrit",
          contenu: `${prenom} ${nom} (${email})`,
          message: `${prenom} ${nom} (${email}) vient de s'inscrire`,
          lu:      false,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);

    return res.status(201).json({
      message: "Compte créé. Vérifiez votre email pour activer votre compte.",
      user: { id: user.id, role: user.role, email: user.email },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
}