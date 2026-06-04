import { useState, useEffect } from 'react';
import ForumThread from './ForumThread';
import { useAuth } from '@/context/AuthContext';

export default function ForumEmbed({ forumId }) {
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

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Chargement du forum...</div>;
  if (error) return <div className="p-4 text-center text-sm text-red-500">{error}</div>;

  const currentUser = user ? {
    id: user.id.toString(),
    firstName: user.prenom,
    lastName: user.nom,
    role: user.role,
  } : null;

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
    <div className="bg-transparent mt-8 relative">
      <ForumThread 
        forum={forum} 
        rootPosts={rootPosts} 
        currentUser={currentUser} 
      />
    </div>
  );
}
