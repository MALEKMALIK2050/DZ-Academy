export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    "token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax" // ✅ Strict → Lax
  );

  return res.status(200).json({ message: "Logged out" });
}