import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  accent: '#208AEF',
  danger: '#DC2626',
  lightGray: '#F3F4F6',
  darkGray: '#6B7280',
};

export default function LoginScreen() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email requis');
      return;
    }
    if (!password.trim()) {
      setLocalError('Mot de passe requis');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setLocalError(error || 'Erreur de connexion');
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/cba-logo.png')} 
              style={styles.logo}
              contentFit="contain"
            />
          </ThemedView>

          <ThemedView style={styles.headerContainer}>
            <ThemedText style={styles.titleMain}>
              Cheikh Bouamama
            </ThemedText>
            <ThemedText style={[styles.titleMain, styles.academyText]}>
              Academy
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Plateforme d'apprentissage en ligne
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.formContainer}>
            {displayError ? (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{displayError}</ThemedText>
              </ThemedView>
            ) : null}

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="votre.email@example.com"
                placeholderTextColor={Colors.darkGray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Mot de passe</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.darkGray}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </ThemedView>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.loginButtonText}>
                  Se connecter
                </ThemedText>
              )}
            </Pressable>

            <ThemedView style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>ou</ThemedText>
              <View style={styles.dividerLine} />
            </ThemedView>

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.registerButtonPressed,
              ]}
              onPress={() => router.push('/auth/register')}
            >
              <ThemedText style={styles.registerButtonText}>
                Créer un compte
              </ThemedText>
            </Pressable>

            <ThemedView style={styles.infoContainer}>
              <ThemedText style={styles.infoText}>
                🔒 Votre connexion est sécurisée
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  titleMain: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 4,
    color: '#1F2937',
  },
  academyText: {
    color: Colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.darkGray,
    marginTop: 12,
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    color: Colors.darkGray,
    fontSize: 12,
  },
  registerButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonPressed: {
    backgroundColor: '#F0FDF4',
  },
  registerButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  infoContainer: {
    gap: 8,
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    color: Colors.primary,
    textAlign: 'center',
    fontSize: 13,
  },
});