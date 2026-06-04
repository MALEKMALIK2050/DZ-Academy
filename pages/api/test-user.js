import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const user = await prisma.user.findUnique({
    where: {
      email: "admin@academy.com",
    },
  });

  res.json(user);
}