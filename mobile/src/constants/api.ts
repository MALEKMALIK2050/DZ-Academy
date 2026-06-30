
// Auto-resolve localhost for emulator vs real devices
const getBaseUrl = () => {
  if (__DEV__) {
    return 'http://192.168.100.18:3000'; // Votre IP locale
  }
  return 'https://academy-dz.vercel.app';
};
  
  

export const API_URL = getBaseUrl();
export const API_ENDPOINTS = {
  login: `${API_URL}/api/auth/login`,
  me: `${API_URL}/api/auth/me`,
  courses: `${API_URL}/api/student/courses`,
  courseDetails: (id: string | number) => `${API_URL}/api/courses/${id}`,
  chapterDetails: (id: string | number) => `${API_URL}/api/chapters/${id}`,
  progress: `${API_URL}/api/student/progress`,
  quiz: `${API_URL}/api/student/quiz`,
  pretestResult: (pretestId: string | number, courseId: string | number) => 
    `${API_URL}/api/pretest/${pretestId}/result?courseId=${courseId}`,
  submitPretest: (courseId: string | number) => 
    `${API_URL}/api/student/submit-pretest?courseId=${courseId}`,
};
