import { useEffect } from "react";
import { useRouter } from "next/router";

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const role = data.user.role;

        router.push(`/dashboard/${role.toLowerCase()}`);
      } catch {
        router.push("/login");
      }
    };

    fetchMe();
  }, []);

  return <p>Redirection dashboard...</p>;
}