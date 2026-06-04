import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Invalid token" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token invalid or expired" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        verifyToken: null,
        verifyExpires: null,
      },
    });

    return res.redirect("/login?verified=true");

  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}