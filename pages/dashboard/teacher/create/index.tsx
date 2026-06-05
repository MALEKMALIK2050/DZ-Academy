import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import CourseCreateForm from "./CourseCreateForm";

interface Category {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
}

export async function getServerSideProps() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    
    return {
      props: {
        categories: JSON.parse(JSON.stringify(categories))
      }
    };
  } catch (error) {
    console.warn("⚠️ Échec temporaire SQL au build ou runtime, repli de secours :", error);
    return {
      props: {
        categories: [
          { id: 1, name: "Ingénierie Pédagogique (Secours)" },
          { id: 2, name: "Développement Web (Secours)" },
          { id: 3, name: "Sciences Cognitives (Secours)" }
        ]
      }
    };
  }
}

export default function TeacherCreatePage({ categories }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Espace Enseignant
          </span>
          <h1 className="text-3xl font-black text-slate-950 mt-2">Création d'un Cours</h1>
          <p className="text-slate-500 text-sm mt-1">
            Complétez les informations pour initialiser la structure dans la base SQL.
          </p>
        </div>

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