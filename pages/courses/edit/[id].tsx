import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditCourse() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erreur chargement cours");
          return;
        }

        setForm({
          title: data.title || "",
          description: data.description || "",
        });
      } catch (err) {
        setError("Erreur serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // ✅ FIX TYPE INPUT
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ FIX TYPE SUBMIT
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur mise à jour");
        return;
      }

      router.push("/courses");
    } catch (err) {
      setError("Erreur serveur");
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="container">
      <h1>Modifier le cours</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Titre"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />

        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
}