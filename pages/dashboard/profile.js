import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Rediriger vers le bon profil selon le rôle
  useEffect(() => {
    if (!user) return;
    if (user.role === "STUDENT") router.push("/dashboard/profile/student");
    else if (user.role === "TEACHER") router.push("/dashboard/profile/teacher");
    else if (user.role === "DESIGNER") router.push("/dashboard/profile/designer");
  }, [user]);

  return (
    <ProtectedRoute>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Redirection en cours...</p>
      </div>
    </ProtectedRoute>
  );
}