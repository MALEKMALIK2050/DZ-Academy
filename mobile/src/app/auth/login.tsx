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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Colors = {
  green: '#7FBF3F',      // Vert CBA
  orange: '#F97316',     // Orange vif
  gold: '#DAA520',       // Or/Doré
  darkText: '#1F2937',
  lightText: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  white: '#FFFFFF',
  lightBg: '#F9FAFB',
};

export default function LoginScreen() {
  const { login, loading, error } = useAuth();
  const insets = useSafeAreaInsets();
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
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header blanc clean */}
          <View style={styles.headerWrapper}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/cba-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <ThemedText style={styles.titleMain}>Cheikh Bouamama Academy</ThemedText>
            <ThemedText style={styles.subtitle}>
              Plateforme d'apprentissage en ligne
            </ThemedText>
          </View>

          {/* Formulaire avec 3 couleurs */}
          <View style={styles.formWrapper}>
            <ThemedView style={styles.formContainer}>
              {displayError ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>⚠️ {displayError}</ThemedText>
                </View>
              ) : null}

              {/* Email - Bordure verte */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.green }]}>
                  Email
                </ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.green }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="vous@exemple.com"
                    placeholderTextColor={Colors.lightText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Mot de passe - Bordure verte */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.green }]}>
                  Mot de passe
                </ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.green }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.lightText}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Bouton Connexion - Vert */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: Colors.green },
                  pressed && styles.loginButtonPressed,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>
                    ✓ Se connecter
                  </ThemedText>
                )}
              </Pressable>

              {/* Divider avec couleurs */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: Colors.green }]} />
                <ThemedText style={[styles.dividerText, { color: Colors.gold }]}>
                  ou
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: Colors.orange }]} />
              </View>

              {/* Bouton Créer compte - Orange */}
              <Pressable
                style={({ pressed }) => [
                  styles.registerButton,
                  { borderColor: Colors.orange, borderWidth: 2 },
                  pressed && styles.registerButtonPressed,
                ]}
                onPress={() => router.push('/auth/register')}
              >
                <ThemedText style={[styles.registerButtonText, { color: Colors.orange }]}>
                  + Créer un compte
                </ThemedText>
              </Pressable>


            </ThemedView>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              CB Academy © 2026
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerWrapper: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  titleMain: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.lightText,
    textAlign: 'center',
    fontWeight: '500',
  },
  formWrapper: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '700',
    fontSize: 14,
  },
  inputBorder: {
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.darkText,
    backgroundColor: Colors.white,
  },
  loginButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 2,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  registerButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  registerButtonPressed: {
    backgroundColor: Colors.lightBg,
  },
  registerButtonText: {
    fontWeight: '800',
    fontSize: 16,
  },
  infoContainer: {
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  footerText: {
    color: Colors.lightText,
    fontSize: 12,
  },
});
