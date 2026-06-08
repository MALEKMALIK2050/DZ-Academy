import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { token } = req.query;
  
  if (!token) {
    return res.redirect("/login?error=missing_token");
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await prisma.user.update({
      where: { id: decoded.id },
      data: { 
        active: true,
        emailVerified: new Date()
      },
    });
    
    return res.redirect("/login?verified=true");
  } catch (error) {
    return res.redirect("/login?error=invalid_token");
  }
}