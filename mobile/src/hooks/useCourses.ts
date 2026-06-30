import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS } from '@/constants/api';

export interface Course {
  id: string | number;
  titre: string;
  description: string;
  niveau?: string;
  enseignant?: string;
  etudiants?: number;
  rating?: number;
  chaptersCount?: number;
  progress?: number;
  createdAt?: string;
}

interface UseCourseReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

/**
 * Hook personnalisé pour récupérer les cours de l'étudiant
 * @param type - 'all' pour tous les cours, 'student' pour les cours de l'étudiant
 * @returns {UseCourseReturn} courses, loading, error, refetch
 */
export const useCourses = (type: 'all' | 'student' = 'student'): UseCourseReturn => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      // Adapter l'endpoint selon le type
      const endpoint = type === 'all' 
        ? API_ENDPOINTS.courses 
        : API_ENDPOINTS.courses;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      
      // Adapter selon la structure de réponse de votre API
      const coursesList = data.courses || data.data || data || [];
      
      setCourses(Array.isArray(coursesList) ? coursesList : []);
    } catch (err) {
      console.error('Fetch courses error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      setCourses([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Récupérer au montage
  useEffect(() => {
    if (token) {
      fetchCourses(true);
    }
  }, [token]);

  // Fonction refetch
  const refetch = async () => {
    await fetchCourses(false);
  };

  return {
    courses,
    loading,
    error,
    refetch,
    isRefreshing,
  };
};

/**
 * Hook pour récupérer les détails d'un cours spécifique
 */
export const useCourseDetail = (courseId: string | number) => {
  const { token } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.courseDetails(courseId);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      const courseData = data.course || data;
      
      setCourse(courseData);
    } catch (err) {
      console.error('Fetch course detail error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && courseId) {
      fetchCourseDetail();
    }
  }, [token, courseId]);

  return {
    course,
    loading,
    error,
    refetch: fetchCourseDetail,
  };
};

/**
 * Hook pour récupérer la progression de l'étudiant
 */
export const useStudentProgress = () => {
  const { token } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.progress, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      console.error('Fetch progress error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProgress();
    }
  }, [token]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  };
};