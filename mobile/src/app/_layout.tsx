import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider, useAuth } from '@/context/auth-context';

function NavigationLayout() {
  const { loading, token } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  // Si pas de token → afficher écrans Auth (Login + Register)
  if (!token) {
    return (
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: 'Retour',
          }}
        />
      </Stack>
    );
  }

  // Si token existe → Navigation complète (Tabs + dynamiques)
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="course/[id]"
        options={{
          headerShown: true,
          title: 'Détails du Cours',
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen
        name="chapter/[id]"
        options={{
          headerShown: true,
          title: 'Contenu du Chapitre',
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen
        name="quiz/[id]"
        options={{
          headerShown: true,
          title: 'Quiz',
          headerBackTitle: 'Retour',
        }}
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