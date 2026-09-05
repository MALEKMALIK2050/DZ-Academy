import { LoadingScreen } from '@/components/loading-screen';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

function NavigationLayout() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="مرحباً بك في دزأكاديمي..." />;
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      headerTintColor: '#059669',
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: '#FAFBFC' },
      contentStyle: { backgroundColor: '#FAFBFC' },
      headerShadowVisible: false,
      headerTitleStyle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/register"
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: 'رجوع',
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="course/[id]"
        options={{
          headerShown: true,
          title: 'البرنامج',
          headerBackTitle: 'رجوع',
        }}
      />
      <Stack.Screen
        name="pretest/[id]"
        options={{
          headerShown: true,
          title: 'اختبار المستوى',
          headerBackTitle: 'رجوع',
        }}
      />
      <Stack.Screen
        name="chapter/[id]"
        options={{
          headerShown: true,
          title: 'الدرس',
          headerBackTitle: 'رجوع',
        }}
      />
      <Stack.Screen
        name="quiz/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NavigationLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}