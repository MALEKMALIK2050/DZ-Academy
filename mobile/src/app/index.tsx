import { Redirect } from 'expo-router';

// تحويل مباشر إلى التبويب الرئيسي
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
