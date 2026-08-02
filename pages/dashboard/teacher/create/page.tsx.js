"use client";

import React, { Suspense } from "react";
import CourseCreateForm from "@/components/CourseCreateForm";

// Données statiques au lieu de category
const staticCategories = [
  { id: 1, name: "الرياضيات" },
  { id: 2, name: "الفيزياء" },
  { id: 3, name: "الإعلام الآلي" },
  { id: 4, name: "اللغة الفرنسية" },
  { id: 5, name: "اللغة الإنجليزية" },
  { id: 6, name: "اللغة العربية" },
  { id: 7, name: "التاريخ والجغرافيا" },
  { id: 8, name: "علوم الحياة والأرض" },
  { id: 9, name: "الفلسفة" },
];

export default function TeacherCreatePage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-slate-950 py-10 px-4 md:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جارٍ التحميل...</div>}>
          <CourseCreateForm categories={staticCategories} />
        </Suspense>
      </div>
    </div>
  );
}
