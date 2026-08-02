

import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  return (
    <div className="sidebar">

      <h2>📚 مساحتي</h2>

      <nav>


        <Link href="/profile">
          <p>👤 الملف الشخصي</p>
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