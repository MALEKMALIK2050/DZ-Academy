import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import CourseCreateForm from "./CourseCreateForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getCategories() {
  try {
    if (!process.env.DATABASE_URL) {
      return [
        { id: 1, name: "Ingénierie Pédagogique" },
        { id: 2, name: "Développement Web" }
      ];
    }
    return await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    return [{ id: 1, name: "Ingénierie Pédagogique" }];
  }
}

export default async function TeacherCreatePage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 md:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Envelopper le formulaire dans Suspense est obligatoire pour Vercel ! */}
        <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Chargement...</div>}>
          <CourseCreateForm categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}