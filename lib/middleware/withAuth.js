import { getSession } from "next-auth/react";

export async function withAuth(handler) {
  return async (req, res) => {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    };

    return handler(req, res);
  };
}