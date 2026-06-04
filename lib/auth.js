import jwt from "jsonwebtoken";

export function verifyToken(req) {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const cookieToken = req.cookies?.token;

  const token = headerToken || cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}