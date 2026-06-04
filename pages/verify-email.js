import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState("Vérification...");

  useEffect(() => {
    const token = router.query.token;

    if (!token) return;

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(() => setStatus("Compte activé !"))
      .catch(() => setStatus("Erreur de vérification"));
  }, [router.query]);

  return <h2>{status}</h2>;
}