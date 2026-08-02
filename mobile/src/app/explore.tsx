import { Redirect } from 'expo-router';

// تحويل مباشر إلى دليل الدورات
export default function Explore() {
  return <Redirect href="/(tabs)/explore" />;
}
