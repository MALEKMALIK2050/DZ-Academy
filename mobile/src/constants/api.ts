// src/constants/api.ts
import { Platform } from 'react-native';

// ── Configuration API ──
// Web (navigateur)  → localhost car même machine
// Native (Expo Go)  → URL Vercel (évite les soucis de réseau local / tunnel)
// Production        → URL Vercel
const DEV_PORT = '3000';

const API_URL_MAP = {
  web: `http://localhost:${DEV_PORT}`,
  native: 'https://cb-academy-dz.vercel.app',
  production: 'https://cb-academy-dz.vercel.app',
};

// En dev, utiliser Vercel pour le web et natif par défaut pour éviter les erreurs si le serveur local n'est pas lancé
const IS_DEV = __DEV__;
export const API_URL = API_URL_MAP.native; // Force l'API en ligne (Vercel) pour tous les environnements

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

  // ── Paiement & Inscription ────────────────────────────
  accessCheck:   (courseId: string | number) =>
    `${API_URL}/api/student/access-check?courseId=${courseId}`,
  enrollCourse:  `${API_URL}/api/student/courses`,
  uploadPreuve:  `${API_URL}/api/student/upload-preuve`,

  // ── Badges & Gamification ─────────────────────────────
  studentBadges: `${API_URL}/api/student/badges`,
};