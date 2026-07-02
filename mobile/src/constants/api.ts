// src/constants/api.ts

export const API_URL = 'https://cb-academy-dz.vercel.app';

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────
  login:    `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  me:       `${API_URL}/api/auth/me`,

  // ── Catalogue public (filtres: niveau, annee, matiere) ──
  cataloguePublic: (params?: { niveau?: string; annee?: string; matiere?: string }) => {
    const q = new URLSearchParams();
    if (params?.niveau)  q.append('niveau',  params.niveau);
    if (params?.annee)   q.append('annee',   params.annee);
    if (params?.matiere) q.append('matiere', params.matiere);
    const qs = q.toString();
    return `${API_URL}/api/courses/public${qs ? `?${qs}` : ''}`;
  },

  // ── Mes cours (enrollments) ────────────────────────────
  studentCourses: `${API_URL}/api/student/courses`,

  // ── Détail cours (chapitres, pretest, quizFinal…) ──────
  courseDetail: (courseId: string | number) =>
    `${API_URL}/api/courses/${courseId}`,
  courseDetails: (courseId: string | number) =>
    `${API_URL}/api/courses/${courseId}`,

  // ── Chapitre (contenu + quiz formatif) ────────────────
  chapterDetail: (chapterId: string | number) =>
    `${API_URL}/api/chapters/${chapterId}`,
  chapterDetails: (chapterId: string | number) =>
    `${API_URL}/api/chapters/${chapterId}`,

  // ── Progression chapitre ──────────────────────────────
  studentProgress: `${API_URL}/api/student/progress`,

  // ── Quiz (formatif ET sommatif) ───────────────────────
  quizGet:    (quizId: string | number) =>
    `${API_URL}/api/student/quiz?quizId=${quizId}`,
  quizSubmit: `${API_URL}/api/student/quiz`,

  // ── Pretest ───────────────────────────────────────────
  pretestGet:    (courseId: string | number) =>
    `${API_URL}/api/pretest/${courseId}`,
  pretestSubmit: (courseId: string | number) =>
    `${API_URL}/api/student/submit-pretest?courseId=${courseId}`,
};