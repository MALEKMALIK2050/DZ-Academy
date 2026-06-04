import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user;

  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { id } = req.query;

  // 🔍 GET USER BY ID
  if (req.method === "GET") {
    const singleUser = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    return res.status(200).json(singleUser);
  }

  // ✏️ UPDATE USER
  if (req.method === "PUT") {
    const { nom, prenom, email, role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        nom,
        prenom,
        email,
        role,
      },
    });

    return res.status(200).json(updatedUser);
  }

  // ❌ DELETE USER
  if (req.method === "DELETE") {
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: "User deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}