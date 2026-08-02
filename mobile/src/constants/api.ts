// src/constants/api.ts
import { Platform } from 'react-native';

export const DZACADEMY_PROD_URL = 'https://dz-academy-6k34.vercel.app';

// Sur le Web, utiliser des URLs relatives '' pour passer par le proxy Metro (évite les blocages CORS du navigateur)
// Sur Mobile (Android / iOS), appeler directement l'URL Vercel de DZ Academy
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? '' : DZACADEMY_PROD_URL);

export const API_ENDPOINTS = {
  // ── المصادقة والحساب (Auth) ──────────────────────────────────
  login:    `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  me:       `${API_URL}/api/auth/me`,

  // ── دليل الدورات العمومي (Catalogue) ─────────────────────────
  cataloguePublic: (params?: { niveau?: string; annee?: string; matiere?: string }) => {
    const q = new URLSearchParams();
    if (params?.niveau)  q.append('niveau',  params.niveau);
    if (params?.annee)   q.append('annee',   params.annee);
    if (params?.matiere) q.append('matiere', params.matiere);
    const qs = q.toString();
    return `${API_URL}/api/courses/public${qs ? `?${qs}` : ''}`;
  },

  // ── دورات الطالب المسجلة ─────────────────────────────────────
  studentCourses: `${API_URL}/api/student/courses`,

  // ── تفاصيل الدورة (الفصول، اختبار المكتسبات القبلية، الاختبار النهائي) ──
  courseDetail: (courseId: string | number) =>
    `${API_URL}/api/courses/${courseId}`,
  courseDetails: (courseId: string | number) =>
    `${API_URL}/api/courses/${courseId}`,

  // ── تفاصيل الفصل (المحتوى والوسائط والاختبار التكويني) ────────
  chapterDetail: (chapterId: string | number) =>
    `${API_URL}/api/chapters/${chapterId}`,
  chapterDetails: (chapterId: string | number) =>
    `${API_URL}/api/chapters/${chapterId}`,

  // ── تقدم الطالب في الفصول ────────────────────────────────────
  studentProgress: `${API_URL}/api/student/progress`,

  // ── الاختبارات والتقييمات (التكوينية والختامية) ───────────────
  quizGet: (quizId: string | number) =>
    `${API_URL}/api/student/quiz?quizId=${quizId}`,
  quizSubmit: `${API_URL}/api/student/quiz`,

  // ── اختبار المكتسبات القبلية (Pretest) ────────────────────────
  pretestGet: (courseId: string | number) =>
    `${API_URL}/api/pretest/${courseId}`,
  pretestSubmit: (courseId: string | number) =>
    `${API_URL}/api/student/submit-pretest?courseId=${courseId}`,

  // ── التسجيل في الدورة ورفع وصل الدفع ─────────────────────────
  accessCheck: (courseId: string | number) =>
    `${API_URL}/api/student/access-check?courseId=${courseId}`,
  enrollCourse:  `${API_URL}/api/student/courses`,
  uploadPreuve:  `${API_URL}/api/student/upload-preuve`,

  // ── الأوسمة والشارات ─────────────────────────────────────────
  studentBadges: `${API_URL}/api/student/badges`,
};