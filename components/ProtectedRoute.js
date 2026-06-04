import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (
      allowedRoles &&
      !allowedRoles.map((r) => r.toLowerCase()).includes(user.role?.toLowerCase()) // ✅ fix casse
    ) {
      router.push("/login");
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) return null;
  if (!user) return null;

  if (
    allowedRoles &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(user.role?.toLowerCase()) // ✅ fix casse
  ) return null;

  return children;
}