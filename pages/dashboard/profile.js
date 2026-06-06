import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    
    const role = user.role?.toLowerCase();
    if (role === "student") router.replace("/dashboard/student");
    else if (role === "teacher") router.replace("/dashboard/teacher");
    else if (role === "designer") router.replace("/dashboard/designer");
    else if (role === "admin") router.replace("/dashboard/admin");
    else router.replace("/dashboard");
  }, [user, loading]);

  return (
    <ProtectedRoute>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Redirection en cours...</p>
      </div>
    </ProtectedRoute>
  );
}