

import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  return (
    <div className="sidebar">

      <h2>📚 Mon espace</h2>

      <nav>


        <Link href="/profile">
          <p>👤 Profil</p>
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