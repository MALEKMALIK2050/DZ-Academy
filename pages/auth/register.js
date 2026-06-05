import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      nom,
      prenom,
      email,
      password,
      role,
      niveau,
      classe,
      tuteur,
    } = req.body || {};

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

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        password: hashedPassword,
        role: role?.toUpperCase() || "STUDENT",
        niveau,
        classe,
        tuteurNom: tuteur?.nom || "",
        tuteurPrenom: tuteur?.prenom || "",
        tuteurTelephone: tuteur?.telephone || "",
        status: "PENDING",
        verifyToken: token,
        verifyExpires: expires,
      },
    });

    const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Confirme ton compte - LMS Bouamama Academy",
      html: `
        <div style="font-family: Arial;">
          <h2>Bienvenue ${prenom}</h2>
          <p>Merci pour ton inscription.</p>
          <p>Confirme ton compte en cliquant ici :</p>
          <a href="${confirmLink}" style="padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:5px;">
            Confirmer mon compte
          </a>
          <p>Ce lien expire dans 24h.</p>
        </div>
      `,
    });

    return res.status(201).json({
      message: "Account created. Check your email.",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}