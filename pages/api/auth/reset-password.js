import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "غير مسموح" });

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "الرمز وكلمة المرور مطلوبان" });
    }

    // Chercher l'utilisateur avec ce token et vérifier si le token n'a pas expiré
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Le token ne doit pas être expiré
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({ success: true, message: "تم إعادة تعيين كلمة المرور بنجاح!" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
