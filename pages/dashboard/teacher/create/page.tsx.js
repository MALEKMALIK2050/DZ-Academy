import React, { Suspense } from "react";
import prisma from "@/lib/prisma"; 
import CourseCreateForm from "./CourseCreateForm"; 

// FORCE LE RENDU DYNAMIQUE AU BUILD POUR ÉVITER LES SOUCIS DE BASE DE DONNÉES SUR VERCEL
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getCategories() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️ DATABASE_URL manquante au build. Utilisation de données de secours.");
      return [
        { id: 1, name: "Ingénierie Pédagogique" },
        { id: 2, name: "Développement Web" },
        { id: 3, name: "Management du Changement" }
      ];
    }
    return await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("⚠️ Échec d'accès à la base de données, retour de données temporaires :", error);
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
            Concevez un nouveau module et liez-le à votre base de données Prisma de manière sécurisée.
          </p>
        </div>

        {/* Suspense externe obligatoire pour useSearchParams au moment du build Next.js */}
        <Suspense fallback={
          <div className="p-8 bg-white border border-slate-200 rounded-3xl animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
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