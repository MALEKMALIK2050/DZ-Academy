import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput
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

interface RegisterFormData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterFormData>({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    if (!formData.prenom.trim()) {
      setError('Prénom requis');
      return false;
    }
    if (!formData.nom.trim()) {
      setError('Nom requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email requis');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email invalide');
      return false;
    }
    if (!formData.password) {
      setError('Mot de passe requis');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Appeler l'endpoint d'inscription du backend
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          email: formData.email,
          password: formData.password,
          role: 'STUDENT', // Par défaut, les inscriptions sont des étudiants
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || 'Erreur lors de l\'inscription');
        return;
      }

      if (data.success) {
        Alert.alert(
          'Inscription réussie',
          'Votre compte a été créé. Connectez-vous maintenant.',
          [
            {
              text: 'Se connecter',
              onPress: () => router.push('/auth/login'),
            },
          ]
        );
      } else {
        setError(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Erreur réseau ou serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError(''); // Effacer l'erreur quand l'utilisateur corrige
  };

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
              Créer un compte
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Rejoignez CBA Academy
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.formContainer}>
            {error ? (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </ThemedView>
            ) : null}

            {/* Ligne 1 : Prénom + Nom */}
            <ThemedView style={styles.row}>
              <ThemedView style={[styles.inputGroup, styles.flex]}>
                <ThemedText style={styles.label}>Prénom</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Ahmed"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.prenom}
                  onChangeText={(value) => handleInputChange('prenom', value)}
                  editable={!loading}
                />
              </ThemedView>

              <ThemedView style={[styles.inputGroup, styles.flex]}>
                <ThemedText style={styles.label}>Nom</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Aït Oualidhene"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.nom}
                  onChangeText={(value) => handleInputChange('nom', value)}
                  editable={!loading}
                />
              </ThemedView>
            </ThemedView>

            {/* Email */}
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="ahmed@example.com"
                placeholderTextColor={Colors.darkGray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                editable={!loading}
              />
            </ThemedView>

            {/* Mot de passe */}
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Mot de passe</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 caractères"
                placeholderTextColor={Colors.darkGray}
                secureTextEntry
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                editable={!loading}
              />
            </ThemedView>

            {/* Confirmation mot de passe */}
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirmer le mot de passe</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={Colors.darkGray}
                secureTextEntry
                value={formData.passwordConfirm}
                onChangeText={(value) => handleInputChange('passwordConfirm', value)}
                editable={!loading}
              />
            </ThemedView>

            {/* Bouton S'inscrire */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.registerButtonPressed,
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.registerButtonText}>
                  Créer mon compte
                </ThemedText>
              )}
            </Pressable>

            {/* Lien vers Login */}
            <ThemedView style={styles.loginLink}>
              <ThemedText style={styles.loginLinkText}>
                Vous avez déjà un compte?{' '}
              </ThemedText>
              <Pressable onPress={() => router.back()}>
                <ThemedText style={styles.loginLinkButton}>
                  Se connecter
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Info */}
            <ThemedView style={styles.infoContainer}>
              <ThemedText style={styles.infoText}>
                📚 En créant un compte, vous acceptez nos conditions d'utilisation
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
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  titleMain: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 4,
    color: '#1F2937',
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.darkGray,
    marginTop: 8,
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '500',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'System',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonPressed: {
    opacity: 0.85,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  loginLinkText: {
    color: Colors.darkGray,
    fontSize: 13,
  },
  loginLinkButton: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  infoContainer: {
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    color: Colors.primary,
    textAlign: 'center',
    fontSize: 12,
  },
});