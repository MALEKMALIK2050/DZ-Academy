import Link from "next/link";
import { useRouter } from "next/router";

export default function SidebarTeacher() {
  const router = useRouter();

  return (
    <div className="sidebar">

      <h2>👨‍🏫 أستاذ</h2>

      <nav>

        <Link href="/dashboard-teacher">
          <p>📚 دروسي</p>
        </Link>

        <Link href="/dashboard-teacher/students">
          <p>👨‍🎓 تلاميذي</p>
        </Link>

        <p
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/');
          }}
          style={{ cursor: 'pointer', color: 'red' }}
        >
          🚪 تسجيل الخروج
        </p>

      </nav>

    </div>
  );
}