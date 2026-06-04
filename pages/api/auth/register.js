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

    const {
      nom,
      prenom,
      email,
      password,
      role,
      niveau,
      classe,
      anneeScolaire,
      tuteur,
    } = body;

    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already used" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

              const user = await prisma.user.create({
                data: {
                  nom,
                  prenom,
                  email,
                  password: hashedPassword,

                  // ✅ FIX ICI
                  role: role?.toUpperCase() || "STUDENT",

                  niveau,
                  classe,

                  // ✅ FIX ICI AUSSI (important)
                  annee: anneeScolaire || null,

                  tuteurNom: tuteur?.nom || "",
                  tuteurPrenom: tuteur?.prenom || "",
                  tuteurTelephone: tuteur?.telephone || "",
                },
              });

    // ✅ Étape 1 : Envoi des identifiants par mail
await sendEmail({
  from: "contact@cb-academt.dz", // domaine validé chez Resend
  to: user.email,
  subject: "Bienvenue sur Bouamama Academy - Vos identifiants",
  html: `
    <h1>Bienvenue ${prenom} !</h1>
    <p>Votre compte a été créé avec succès.</p>
    <p><strong>Identifiants de connexion :</strong></p>
    <ul>
      <li>Email : ${email}</li>
      <li>Mot de passe : ${password}</li>
    </ul>
    <p>Vous pouvez vous connecter dès maintenant sur notre plateforme.</p>
  `,
});


    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`
    );

    return res.status(201).json({
      message: "Account created",
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      error: "Server error",
      detail: error.message,
    });
  }
}