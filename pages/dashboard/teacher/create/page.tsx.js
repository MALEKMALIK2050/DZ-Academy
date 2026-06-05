"use client";

import React, { Suspense } from "react";
import CourseCreateForm from "@/components/CourseCreateForm";

// Données statiques au lieu de category
const staticCategories = [
  { id: 1, name: "Mathématiques" },
  { id: 2, name: "Physique" },
  { id: 3, name: "Informatique" },
  { id: 4, name: "Français" },
  { id: 5, name: "Anglais" },
  { id: 6, name: "Arabe" },
  { id: 7, name: "Histoire-Géographie" },
  { id: 8, name: "SVT" },
  { id: 9, name: "Philosophie" },
];

export default function TeacherCreatePage() {
  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 md:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Chargement...</div>}>
          <CourseCreateForm categories={staticCategories} />
        </Suspense>
      </div>
    </div>
  );
}