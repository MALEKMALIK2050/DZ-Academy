import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { LoadingScreen } from '@/components/loading-screen';

export default function Index() {
  const { token, loading } = useAuth();

  // أثناء قراءة الجلسة المخزنة، عرض شاشة التحميل
  if (loading) {
    return <LoadingScreen message="مرحباً بك في دزأكاديمي..." />;
  }

  // إذا لم يكن هناك جلسة نشطة، التوجيه المباشر إلى شاشة الدخول
  if (!token) {
    return <Redirect href="/auth/login" />;
  }

  // إذا كان الطالب مسجلاً، التوجيه إلى الدورات
  return <Redirect href="/(tabs)" />;
}
