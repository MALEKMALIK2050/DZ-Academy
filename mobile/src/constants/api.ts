// src/constants/api.ts

export const API_URL = 'https://cb-academy-dz.vercel.app';

export const API_ENDPOINTS = {
  // Auth
  login: `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  me: `${API_URL}/api/auth/me`,

  // Student Courses
  studentCourses: `${API_URL}/api/student/courses`,
  
  // Pretest
  pretest: (courseId: string | number) => `${API_URL}/api/student/pretest?courseId=${courseId}`,
  submitPretest: (courseId: string | number) => `${API_URL}/api/student/pretest/${courseId}/submit`,
  
  // Chapter
  chapter: (chapterId: string | number) => `${API_URL}/api/chapters/${chapterId}`,
  
  // Quiz
  quiz: `${API_URL}/api/student/quiz`,
  
  // Course
  course: (courseId: string | number) => `${API_URL}/api/courses/${courseId}`,
};