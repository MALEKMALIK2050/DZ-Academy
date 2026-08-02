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

export const useCourses = (type: 'all' | 'student' = 'student'): UseCourseReturn => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const endpoint = type === 'all'
        ? API_ENDPOINTS.cataloguePublic()
        : API_ENDPOINTS.studentCourses;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`خطأ ${response.status}`);

      const data = await response.json();
      const coursesList = data.courses || data.enrollments || data.data || data || [];
      setCourses(Array.isArray(coursesList) ? coursesList : []);
    } catch (err) {
      console.error('Fetch courses error:', err);
      setError(err instanceof Error ? err.message : 'خطأ أثناء التحميل');
      setCourses([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchCourses(true);
  }, [token]);

  const refetch = async () => { await fetchCourses(false); };

  return { courses, loading, error, refetch, isRefreshing };
};

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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`خطأ ${response.status}`);
      const data = await response.json();
      setCourse(data.course || data);
    } catch (err) {
      console.error('Fetch course detail error:', err);
      setError(err instanceof Error ? err.message : 'خطأ أثناء التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && courseId) fetchCourseDetail();
  }, [token, courseId]);

  return { course, loading, error, refetch: fetchCourseDetail };
};

export const useStudentProgress = () => {
  const { token } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.studentProgress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`خطأ ${response.status}`);
      const data = await response.json();
      setProgress(data);
    } catch (err) {
      console.error('Fetch progress error:', err);
      setError(err instanceof Error ? err.message : 'خطأ أثناء التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProgress();
  }, [token]);

  return { progress, loading, error, refetch: fetchProgress };
};