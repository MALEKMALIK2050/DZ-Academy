import { verifyToken } from "../../lib/auth";

export function requireAdmin(req, res) {
  const user = verifyToken(req);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return user;
}