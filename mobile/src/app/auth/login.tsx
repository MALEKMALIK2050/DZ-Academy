// src/app/auth/login.tsx
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
  green: '#059669',
  orange: '#F97316',
  gold: '#D97706',
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
      setLocalError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!password.trim()) {
      setLocalError('يرجى إدخال كلمة المرور');
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)');
    } else {
      setLocalError(error || 'فشل تسجيل الدخول، تحقق من البيانات');
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerWrapper}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/icon.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <ThemedText style={styles.titleMain}>دزأكاديمي — DZ Academy</ThemedText>
            <ThemedText style={styles.subtitle}>
              منصة التعليم الرقمي للطورين المتوسط والثانوي
            </ThemedText>
          </View>

          <View style={styles.formWrapper}>
            <ThemedView style={styles.formContainer}>
              {displayError ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>⚠️ {displayError}</ThemedText>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.green }]}>البريد الإلكتروني</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.green }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="etudiant@dzacademy.dz"
                    placeholderTextColor={Colors.lightText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.green }]}>
                  كلمة المرور
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
                    textAlign="right"
                  />
                </View>
              </View>

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
                    تسجيل الدخول
                  </ThemedText>
                )}
              </Pressable>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />
                <ThemedText style={[styles.dividerText, { color: Colors.gold }]}>أو</ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.registerButton,
                  { borderColor: Colors.orange, borderWidth: 1.5 },
                  pressed && styles.registerButtonPressed,
                ]}
                onPress={() => router.push('/auth/register')}
              >
                <ThemedText style={[styles.registerButtonText, { color: Colors.orange }]}>
                  + إنشاء حساب تلميذ جديد
                </ThemedText>
              </Pressable>
            </ThemedView>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              منصة دزأكاديمي التعليمية © 2026
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  headerWrapper: {
    paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center',
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  logoContainer: { marginBottom: 16 },
  logo: { width: 100, height: 100, borderRadius: 50 },
  titleMain: { fontSize: 22, fontWeight: '900', color: Colors.darkText, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: Colors.lightText, textAlign: 'center', fontWeight: '500' },
  formWrapper: { paddingHorizontal: 16, marginVertical: 20 },
  formContainer: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 22, gap: 18,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2', borderRightWidth: 4, borderRightColor: Colors.danger,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8,
  },
  errorText: { color: Colors.danger, fontWeight: '700', fontSize: 13, textAlign: 'right' },
  inputGroup: { gap: 6 },
  label: { fontWeight: '700', fontSize: 13, textAlign: 'right' },
  inputBorder: { borderWidth: 1.5, borderRadius: 10, overflow: 'hidden' },
  input: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.darkText, backgroundColor: Colors.white },
  loginButton: {
    borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6,
    shadowColor: Colors.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  loginButtonPressed: { opacity: 0.85 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '700' },
  registerButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.white },
  registerButtonPressed: { backgroundColor: Colors.lightBg },
  registerButtonText: { fontWeight: '800', fontSize: 15 },
  footer: { alignItems: 'center', paddingVertical: 12, backgroundColor: Colors.white },
  footerText: { color: Colors.lightText, fontSize: 12 },
});
