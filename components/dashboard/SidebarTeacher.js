import Link from "next/link";
import { useRouter } from "next/router";

export default function SidebarTeacher() {
  const router = useRouter();

  return (
    <div className="sidebar">

      <h2>🎓 Teacher</h2>

      <nav>

        <Link href="/dashboard-teacher">
          <p>📚 Mes cours</p>
        </Link>

        <Link href="/dashboard-teacher/students">
          <p>👨‍🎓 Élèves</p>
        </Link>

        <p
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/');
          }}
          style={{ cursor: 'pointer', color: 'red' }}
        >
          🚪 Déconnexion
        </p>

      </nav>

    </div>
  );
}