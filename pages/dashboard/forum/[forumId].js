import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ForumThread from "@/components/forum/ForumThread";

export default function ForumPage() {
  const router = useRouter();
  const { forumId } = router.query;
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!forumId) return;
    fetchForum();
  }, [forumId]);

  const fetchForum = async () => {
    try {
      const res = await fetch(`/api/forum/${forumId}`, { credentials: "include" });
      const d = await res.json();
      if (res.ok) {
        setData(d);
      } else {
        setError(d.error || "Erreur chargement forum");
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement du forum...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  // Mapper User vers ForumAuthor type
  const currentUser = user ? {
    id: user.id.toString(),
    firstName: user.prenom,
    lastName: user.nom,
    role: user.role,
  } : null;

  // Adapter les posts pour le composant (renommer nom/prenom en firstName/lastName si nécessaire)
  const mapPost = (p) => ({
    ...p,
    id: p.id.toString(),
    forumId: p.forumId.toString(),
    author: {
      id: p.author.id.toString(),
      firstName: p.author.prenom,
      lastName: p.author.nom,
      role: p.author.role,
    },
    children: p.children?.map(mapPost) || [],
  });

  const rootPosts = data.rootPosts.map(mapPost);
  const forum = {
    ...data.forum,
    id: data.forum.id.toString(),
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "DESIGNER", "ADMIN"]}>
      <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          
          <button 
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Retour au cours
          </button>

          {data && (
            <ForumThread 
              forum={forum} 
              rootPosts={rootPosts} 
              currentUser={currentUser} 
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
