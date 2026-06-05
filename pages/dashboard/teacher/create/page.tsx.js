import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import CourseCreateForm from "./CourseCreateForm"; // Import du formulaire client

// SÉCURITÉ CRUCIALE : On force l'analyse à être entièrement DYNAMIQUE au Runtime
export const dynamic = "force-dynamic";
export const revalidate = 0;

// On récupère les catégories de façon résistante aux pannes de build sur Vercel
async function getCategories() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️ DATABASE_URL non définie sur Vercel à la compilation. Données temporaires configurées.");
      return [
        { id: 1, name: "Ingénierie Pédagogique" },
        { id: 2, name: "Développement Web" },
        { id: 3, name: "Sciences Cognitives" }
      ];
    }
    return await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("⚠️ Échec temporaire de connexion SQL, fallback utilisé :", error);
    return [
      { id: 1, name: "Ingénierie Pédagogique (Secours)" },
      { id: 2, name: "Développement Web (Secours)" }
    ];
  }
}

export default async function TeacherCreatePage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Espace Enseignant
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">Création d'un Cours</h1>
          <p className="text-slate-500 text-sm mt-1">
            Complétez les informations pour initialiser la structure dans la base SQL.
          </p>
        </div>

        {/* Tout composant utilisant useSearchParams() DOIT être enveloppé dans Suspense pour ne pas planter Next.js au build ! */}
        <Suspense fallback={
          <div className="p-8 bg-white border border-slate-200 rounded-3xl animate-pulse space-y-4">
            <div className="h-6 w-1/4 bg-slate-200 rounded" />
            <div className="h-12 w-full bg-slate-100 rounded" />
            <div className="h-12 w-full bg-slate-100 rounded" />
          </div>
        }>
          <CourseCreateForm categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}