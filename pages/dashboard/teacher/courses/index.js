"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";



export default function TeacherCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data);
    };

    fetchCourses();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>📚 Mes cours (Teacher)</h1>

      {courses.map((c) => (
        <div key={c.id}>
          <h3>{c.title}</h3>

          <button
            onClick={() =>
              router.push(`/dashboard/teacher/courses/${c.id}`)
            }
          >
            Ouvrir
          </button>
        </div>
      ))}
    </div>
  );
}