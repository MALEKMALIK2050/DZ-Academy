import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
  TextInput,
  View,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Colors = {
  orange: '#F97316',     // Orange vif
  green: '#7FBF3F',      // Vert CBA
  darkText: '#1F2937',
  lightText: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  white: '#FFFFFF',
  lightBg: '#F9FAFB',
};

// ── Modals ──
function InfoModal({ visible, title, content, onClose }: {
  visible: boolean; title: string; content: string; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <ThemedText style={modalStyles.title}>{title}</ThemedText>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <ThemedText style={modalStyles.closeTxt}>✕</ThemedText>
          </Pressable>
        </View>
        <ScrollView style={modalStyles.body} contentContainerStyle={{ paddingBottom: 40 }}>
          <ThemedText style={modalStyles.content}>{content}</ThemedText>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string;
  options: { value: string; label: string }[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <ThemedText style={modalStyles.title}>{title}</ThemedText>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <ThemedText style={modalStyles.closeTxt}>✕</ThemedText>
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 300 }}>
          {options.map(opt => (
            <Pressable key={opt.value} style={[pk.option, selected === opt.value && pk.optionSelected]}
              onPress={() => { onSelect(opt.value); onClose(); }}>
              <ThemedText style={[pk.optionText, selected === opt.value && pk.optionTextSelected]}>
                {opt.label}
              </ThemedText>
              {selected === opt.value && <ThemedText style={pk.checkmark}>✓</ThemedText>}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const CGU_TEXT = `CONDITIONS GÉNÉRALES D'UTILISATION

Article 1 - Champ d'application
Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme CB ACADEMY.

Article 2 - Acceptation des conditions
L'inscription sur la plateforme implique l'acceptation pleine et entière des présentes CGU.

Article 3 - Protection des données personnelles
Conformément à la loi algérienne n°18-07 du 10 juin 2018 :
• Les données collectées sont strictement nécessaires à la gestion des inscriptions et du suivi pédagogique.
• L'utilisateur dispose d'un droit d'accès, de rectification et d'opposition sur ses données.
• Les données sont conservées pour une durée maximale de 5 ans après la dernière activité.`;

const PRIVACY_TEXT = `POLITIQUE DE CONFIDENTIALITÉ

Nous collectons et traitons vos données personnelles conformément à la loi algérienne n°18-07 du 10 juin 2018.

Données collectées :
• Informations d'identité (prénom, nom)
• Informations scolaires (niveau, classe)
• Données de contact (email, téléphone)
• Informations du tuteur (si applicable)

Utilisation :
Les données sont utilisées exclusivement pour :
• Gérer votre compte et votre inscription
• Assurer le suivi pédagogique
• Vous adresser des communications importantes

Vos droits :
Vous disposez d'un droit d'accès, de rectification et d'opposition sur vos données.
Contactez-nous à contact@cb-academy-dz.com pour exercer vos droits.

Sécurité :
Vos données sont protégées par des mesures de sécurité appropriées.`;

const niveaux = [
  { value: '1AS', label: '1ère Année Secondaire' },
  { value: '2AS', label: '2ème Année Secondaire' },
  { value: '3AS', label: '3ème Année Secondaire' },
];

const classes = [
  { value: 'A', label: 'Classe A' },
  { value: 'B', label: 'Classe B' },
  { value: 'C', label: 'Classe C' },
];

interface RegisterFormData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  passwordConfirm: string;
  niveau: string;
  classe: string;
  tuteurNom: string;
  tuteurPrenom: string;
  telephone: string;
  cguAccepted: boolean;
  privacyAccepted: boolean;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<RegisterFormData>({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    passwordConfirm: '',
    niveau: '',
    classe: '',
    tuteurNom: '',
    tuteurPrenom: '',
    telephone: '',
    cguAccepted: false,
    privacyAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNiveauPicker, setShowNiveauPicker] = useState(false);
  const [showClassePicker, setShowClassePicker] = useState(false);
  const [showCgu, setShowCgu] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.prenom.trim()) { setError('Prénom requis'); return false; }
    if (!formData.nom.trim()) { setError('Nom requis'); return false; }
    if (!formData.email.trim()) { setError('Email requis'); return false; }
    if (!formData.email.includes('@')) { setError('Email invalide'); return false; }
    if (!formData.password) { setError('Mot de passe requis'); return false; }
    if (formData.password.length < 6) { setError('Minimum 6 caractères'); return false; }
    if (formData.password !== formData.passwordConfirm) { setError('Les mots de passe ne correspondent pas'); return false; }
    if (!formData.niveau) { setError('Niveau requis'); return false; }
    if (!formData.classe) { setError('Classe requise'); return false; }
    if (!formData.cguAccepted) { setError('Veuillez accepter les conditions'); return false; }
    if (!formData.privacyAccepted) { setError('Veuillez accepter la politique de confidentialité'); return false; }
    return true;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('https://cb-academy-dz.vercel.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          email: formData.email,
          password: formData.password,
          niveau: formData.niveau,
          classe: formData.classe,
          tuteurNom: formData.tuteurNom,
          tuteurPrenom: formData.tuteurPrenom,
          telephone: formData.telephone,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(
          '✓ Inscription réussie',
          'Votre compte a été créé. Veuillez vérifier votre email pour le confirmer.',
          [{ text: 'Aller à la connexion', onPress: () => router.back() }]
        );
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (e) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header blanc clean */}
          <View style={styles.headerWrapper}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/cba-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <ThemedText style={styles.titleMain}>Rejoignez CB Academy</ThemedText>
            <ThemedText style={styles.subtitle}>Créez votre compte pour commencer</ThemedText>
          </View>

          {/* Formulaire - Style Login */}
          <View style={styles.formWrapper}>
            <ThemedView style={styles.formContainer}>
              {error ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
                </View>
              ) : null}

              {/* Identité */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Prénom</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.orange }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre prénom"
                    placeholderTextColor={Colors.lightText}
                    value={formData.prenom}
                    onChangeText={(val) => handleInputChange('prenom', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Nom</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.orange }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom"
                    placeholderTextColor={Colors.lightText}
                    value={formData.nom}
                    onChangeText={(val) => handleInputChange('nom', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Études */}
              <View style={styles.dividerThin} />

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Niveau</ThemedText>
                <Pressable
                  style={[styles.selectBtn, { borderColor: Colors.orange, borderWidth: 2 }]}
                  onPress={() => setShowNiveauPicker(true)}
                >
                  <ThemedText style={formData.niveau ? styles.selectBtnTxt : styles.placeholderTxt}>
                    {formData.niveau || 'Choisir niveau'}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Classe</ThemedText>
                <Pressable
                  style={[styles.selectBtn, { borderColor: Colors.orange, borderWidth: 2 }]}
                  onPress={() => setShowClassePicker(true)}
                >
                  <ThemedText style={formData.classe ? styles.selectBtnTxt : styles.placeholderTxt}>
                    {formData.classe || 'Choisir classe'}
                  </ThemedText>
                </Pressable>
              </View>

              {/* Tuteur optionnel */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.lightText }]}>Tuteur (optionnel)</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.border }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom du tuteur"
                    placeholderTextColor={Colors.lightText}
                    value={formData.tuteurPrenom}
                    onChangeText={(val) => handleInputChange('tuteurPrenom', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={[styles.inputBorder, { borderColor: Colors.border }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du tuteur"
                    placeholderTextColor={Colors.lightText}
                    value={formData.tuteurNom}
                    onChangeText={(val) => handleInputChange('tuteurNom', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={[styles.inputBorder, { borderColor: Colors.border }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Téléphone"
                    placeholderTextColor={Colors.lightText}
                    keyboardType="phone-pad"
                    value={formData.telephone}
                    onChangeText={(val) => handleInputChange('telephone', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email & Mot de passe - ORANGE */}
              <View style={styles.dividerThin} />

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Email</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.orange }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="vous@exemple.com"
                    placeholderTextColor={Colors.lightText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(val) => handleInputChange('email', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Mot de passe</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.orange }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.lightText}
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(val) => handleInputChange('password', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: Colors.orange }]}>Confirmer mot de passe</ThemedText>
                <View style={[styles.inputBorder, { borderColor: Colors.orange }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.lightText}
                    secureTextEntry
                    value={formData.passwordConfirm}
                    onChangeText={(val) => handleInputChange('passwordConfirm', val)}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Acceptations */}
              <View style={styles.acceptSection}>
                <Pressable style={styles.checkboxRow} onPress={() => handleInputChange('cguAccepted', !formData.cguAccepted)}>
                  <View style={[styles.checkbox, formData.cguAccepted && { backgroundColor: Colors.orange, borderColor: Colors.orange }]}>
                    {formData.cguAccepted && <ThemedText style={styles.checkIcon}>✓</ThemedText>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.checkboxText}>
                      J'accepte les{' '}
                      <Pressable onPress={() => setShowCgu(true)}>
                        <ThemedText style={[styles.linkText, { color: Colors.orange }]}>Conditions</ThemedText>
                      </Pressable>
                    </ThemedText>
                  </View>
                </Pressable>

                <Pressable style={styles.checkboxRow} onPress={() => handleInputChange('privacyAccepted', !formData.privacyAccepted)}>
                  <View style={[styles.checkbox, formData.privacyAccepted && { backgroundColor: Colors.orange, borderColor: Colors.orange }]}>
                    {formData.privacyAccepted && <ThemedText style={styles.checkIcon}>✓</ThemedText>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.checkboxText}>
                      J'accepte la{' '}
                      <Pressable onPress={() => setShowPrivacy(true)}>
                        <ThemedText style={[styles.linkText, { color: Colors.orange }]}>Politique</ThemedText>
                      </Pressable>
                    </ThemedText>
                  </View>
                </Pressable>
              </View>

              {/* Bouton - ORANGE */}
              <Pressable
                style={({ pressed }) => [
                  styles.registerButton,
                  { backgroundColor: Colors.orange },
                  pressed && styles.registerButtonPressed,
                  loading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <ThemedText style={styles.registerButtonText}>
                    ✓ Créer un compte
                  </ThemedText>
                )}
              </Pressable>

              {/* Lien Login - VERT */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginLink,
                  pressed && styles.loginLinkPressed,
                ]}
                onPress={() => router.back()}
              >
                <ThemedText style={[styles.loginLinkText, { color: Colors.green }]}>
                  Se connecter
                </ThemedText>
              </Pressable>
            </ThemedView>
          </View>

          {/* Modals */}
          <PickerModal visible={showNiveauPicker} title="Choisir niveau" options={niveaux} selected={formData.niveau} onSelect={(val) => handleInputChange('niveau', val)} onClose={() => setShowNiveauPicker(false)} />
          <PickerModal visible={showClassePicker} title="Choisir classe" options={classes} selected={formData.classe} onSelect={(val) => handleInputChange('classe', val)} onClose={() => setShowClassePicker(false)} />
          <InfoModal visible={showCgu} title="📋 Conditions d'utilisation" content={CGU_TEXT} onClose={() => setShowCgu(false)} />
          <InfoModal visible={showPrivacy} title="🔐 Politique de confidentialité" content={PRIVACY_TEXT} onClose={() => setShowPrivacy(false)} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontWeight: '700', fontSize: 16, color: Colors.darkText },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 18, color: Colors.lightText },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  content: { fontSize: 14, lineHeight: 22, color: '#374151' },
});

const pk = StyleSheet.create({
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionSelected: { backgroundColor: Colors.lightBg },
  optionText: { fontSize: 15, color: Colors.darkText },
  optionTextSelected: { color: Colors.orange, fontWeight: '700' },
  checkmark: { color: Colors.orange, fontWeight: '700', fontSize: 16 },
});

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
    gap: 16,
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
    marginBottom: 8,
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
  selectBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  selectBtnTxt: {
    fontSize: 14,
    color: Colors.darkText,
    fontWeight: '600',
  },
  placeholderTxt: {
    color: Colors.lightText,
    fontWeight: '500',
  },
  dividerThin: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  acceptSection: {
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginTop: 2,
  },
  checkIcon: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxText: {
    fontSize: 13,
    color: Colors.lightText,
    lineHeight: 18,
  },
  linkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  registerButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  registerButtonPressed: {
    opacity: 0.85,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  loginLink: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  loginLinkPressed: {
    opacity: 0.7,
  },
  loginLinkText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
