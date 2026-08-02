// src/app/auth/register.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_ENDPOINTS } from '@/constants/api';
import {
  NIVEAUX,
  ANNEES_COLLEGE,
  ANNEES_LYCEE,
} from '@/constants/algerian-education';

const Colors = {
  primary: '#059669',
  primaryDark: '#047857',
  secondary: '#F97316',
  darkText: '#1F2937',
  lightText: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  white: '#FFFFFF',
  lightBg: '#F9FAFB',
};

// ── نافذة منبثقة للنصوص والمعلومات (الشروط والخصوصية) ──────────────
function InfoModal({
  visible,
  title,
  content,
  onClose,
}: {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <ThemedText style={modalStyles.closeTxt}>✕</ThemedText>
          </Pressable>
          <ThemedText style={modalStyles.title}>{title}</ThemedText>
        </View>
        <ScrollView style={modalStyles.body} contentContainerStyle={{ paddingBottom: 30 }}>
          <ThemedText style={modalStyles.content}>{content}</ThemedText>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── نافذة اختيار منسدلة أنيقة (PickerModal) ────────────────────────
function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <ThemedText style={modalStyles.closeTxt}>✕</ThemedText>
          </Pressable>
          <ThemedText style={modalStyles.title}>{title}</ThemedText>
        </View>
        <ScrollView style={{ maxHeight: 320 }}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[pk.option, selected === opt.value && pk.optionSelected]}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
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

const CGU_TEXT = `شروط الاستخدام العامة لمنصة دزأكاديمي (DZ Academy)

المادة 1 - نطاق التطبيق:
تنظم هذه الشروط العامة شروط وإجراءات الاستفادة من الخدمات التعليمية ومحتويات منصة دزأكاديمي.

المادة 2 - شروط التسجيل وحساب التلميذ:
• الحساب شخصي ومخصص للتلميذ المسجل حصراً.
• يجب تقديم معلومات حقيقية ودقيقة خاصة بالاسم واللقب والمستوى الدراسي.
• يتحمل التلميذ وولي أمره مسؤولية الحفاظ على سرية كلمة المرور.

المادة 3 - حماية المعطيات الشخصية (وفقاً للقانون الجزائري رقم 18-07):
• تلتزم منصة دزأكاديمي بحماية خصوصية بيانات التلاميذ وأولياء الأمور.
• تُستخدم البيانات حصراً لإدارة التمدرس والمتابعة البيداغوجية والتقييمات.
• يحق للتلميذ وولي أمره طلب تصحيح أو حذف معطياته وفق القانون.`;

const PRIVACY_TEXT = `سياسة الخصوصية وحماية المعطيات

تلتزم منصة دزأكاديمي DZ Academy بالشفافية الكاملة في معالجة بيانات التلاميذ:

البيانات المجمعة:
• الهوية الأكاديمية (الاسم، اللقب، البريد الإلكتروني).
• المستوى الدراسي والطور (متوسط / ثانوي) والسنة الدراسية.
• معلومات التواصل مع ولي الأمر (للمتابعة التربوية للتلاميذ القُصّر).
• مسار التقدم في الدروس، والنتائج المحققة في الاختبارات التكوينية والنهائية.

الهدف من الاستخدام:
• تخصيص المسار التعليمي وعرض الدروس المناسبة لمنهاج التلميذ.
• تمكين الأساتذة من تقديم الدعم والمعالجة البيداغوجية عند الحاجة.
• إصدار كشوف النقاط وشهادات إتمام الدورات.`;

interface RegisterFormData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  passwordConfirm: string;
  niveau: string; // 'college' | 'lycee'
  classe: string; // 'السنة الأولى متوسط', etc.
  tuteurNom: string;
  tuteurPrenom: string;
  tuteurTelephone: string;
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
    niveau: 'college',
    classe: 'السنة الأولى متوسط',
    tuteurNom: '',
    tuteurPrenom: '',
    tuteurTelephone: '',
    cguAccepted: false,
    privacyAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNiveauPicker, setShowNiveauPicker] = useState(false);
  const [showClassePicker, setShowClassePicker] = useState(false);
  const [showCgu, setShowCgu] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // خيارات السنوات حسب الطور المختار
  const currentClasseOptions =
    formData.niveau === 'college'
      ? ANNEES_COLLEGE.map((a) => ({ value: a.value, label: a.label }))
      : ANNEES_LYCEE.map((a) => ({ value: a.value, label: a.label }));

  const validateForm = (): boolean => {
    if (!formData.prenom.trim()) {
      setError('يرجى إدخال الاسم الشخصي.');
      return false;
    }
    if (!formData.nom.trim()) {
      setError('يرجى إدخال اللقب العائلي.');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('يجب ألا تقل كلمة المرور عن 6 أحرف.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('كلمتا المرور غير متطابقتين.');
      return false;
    }
    if (!formData.niveau) {
      setError('يرجى اختيار الطور التعليمي.');
      return false;
    }
    if (!formData.classe) {
      setError('يرجى اختيار السنة الدراسية.');
      return false;
    }
    if (!formData.cguAccepted || !formData.privacyAccepted) {
      setError('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'STUDENT',
        niveau: formData.niveau,
        classe: formData.classe,
        anneeScolaire: formData.classe,
        tuteur: {
          nom: formData.tuteurNom.trim(),
          prenom: formData.tuteurPrenom.trim(),
          telephone: formData.tuteurTelephone.trim(),
        },
      };

      const res = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في عملية إنشاء الحساب');
      }

      Alert.alert(
        '🎉 تم إنشاء الحساب بنجاح',
        'تم تسجيل حسابك في منصة دزأكاديمي بنجاح. يرجى تفعيل حسابك من خلال الرابط المرسل إلى بريدك الإلكتروني ثم تسجيل الدخول.',
        [
          {
            text: 'الانتقال لتسجيل الدخول',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الشبكة، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* العنوان والترحيب */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>إنشاء حساب تلميذ جديد 📝</ThemedText>
          <ThemedText style={styles.subtitle}>
            انضم إلى أكاديمية دزأكاديمي وابدأ رحلة التفوق في المنهاج الجزائري
          </ThemedText>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
          </View>
        ) : null}

        {/* ── 1. المعلومات الشخصية ── */}
        <ThemedText style={styles.sectionTitle}>👤 المعلومات الشخصية</ThemedText>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={styles.label}>الاسم</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="محمد"
              placeholderTextColor="#9CA3AF"
              value={formData.prenom}
              onChangeText={(t) => setFormData({ ...formData, prenom: t })}
              textAlign="right"
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={styles.label}>اللقب</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="بن علي"
              placeholderTextColor="#9CA3AF"
              value={formData.nom}
              onChangeText={(t) => setFormData({ ...formData, nom: t })}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>البريد الإلكتروني</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="etudiant@dzacademy.dz"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(t) => setFormData({ ...formData, email: t })}
            textAlign="right"
          />
        </View>

        {/* ── 2. المسار الدراسي الجزائري ── */}
        <ThemedText style={styles.sectionTitle}>📚 المسار الدراسي الجزائري</ThemedText>
        <View style={styles.field}>
          <ThemedText style={styles.label}>الطور التعليمي</ThemedText>
          <Pressable style={styles.selectBtn} onPress={() => setShowNiveauPicker(true)}>
            <ThemedText style={styles.selectArrow}>▼</ThemedText>
            <ThemedText style={styles.selectBtnTxt}>
              {formData.niveau === 'college' ? 'التعليم المتوسط (CEM)' : 'التعليم الثانوي (Lycée)'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>السنة الدراسية</ThemedText>
          <Pressable style={styles.selectBtn} onPress={() => setShowClassePicker(true)}>
            <ThemedText style={styles.selectArrow}>▼</ThemedText>
            <ThemedText style={styles.selectBtnTxt}>{formData.classe}</ThemedText>
          </Pressable>
        </View>

        {/* ── 3. معلومات ولي الأمر (للمتابعة) ── */}
        <ThemedText style={styles.sectionTitle}>👨‍👧‍👦 معلومات ولي الأمر</ThemedText>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={styles.label}>اسم الولي</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="أحمد"
              placeholderTextColor="#9CA3AF"
              value={formData.tuteurPrenom}
              onChangeText={(t) => setFormData({ ...formData, tuteurPrenom: t })}
              textAlign="right"
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={styles.label}>لقب الولي</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="بن علي"
              placeholderTextColor="#9CA3AF"
              value={formData.tuteurNom}
              onChangeText={(t) => setFormData({ ...formData, tuteurNom: t })}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>رقم هاتف الولي (للإشعارات)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="0550123456"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={formData.tuteurTelephone}
            onChangeText={(t) => setFormData({ ...formData, tuteurTelephone: t })}
            textAlign="right"
          />
        </View>

        {/* ── 4. كلمة المرور ── */}
        <ThemedText style={styles.sectionTitle}>🔒 كلمة المرور والأمان</ThemedText>
        <View style={styles.field}>
          <ThemedText style={styles.label}>كلمة المرور</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={formData.password}
            onChangeText={(t) => setFormData({ ...formData, password: t })}
            textAlign="right"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>تأكيد كلمة المرور</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={formData.passwordConfirm}
            onChangeText={(t) => setFormData({ ...formData, passwordConfirm: t })}
            textAlign="right"
          />
        </View>

        {/* ── 5. الشروط والسياسات ── */}
        <View style={styles.policyRow}>
          <Pressable
            style={[styles.checkbox, formData.cguAccepted && styles.checkboxActive]}
            onPress={() => setFormData({ ...formData, cguAccepted: !formData.cguAccepted })}
          >
            {formData.cguAccepted && <ThemedText style={styles.checkMark}>✓</ThemedText>}
          </Pressable>
          <View style={styles.policyTextWrapper}>
            <ThemedText style={styles.policyText}>
              أوافق على{' '}
              <ThemedText style={styles.policyLink} onPress={() => setShowCgu(true)}>
                شروط الاستخدام العامة
              </ThemedText>
            </ThemedText>
          </View>
        </View>

        <View style={styles.policyRow}>
          <Pressable
            style={[styles.checkbox, formData.privacyAccepted && styles.checkboxActive]}
            onPress={() => setFormData({ ...formData, privacyAccepted: !formData.privacyAccepted })}
          >
            {formData.privacyAccepted && <ThemedText style={styles.checkMark}>✓</ThemedText>}
          </Pressable>
          <View style={styles.policyTextWrapper}>
            <ThemedText style={styles.policyText}>
              أوافق على{' '}
              <ThemedText style={styles.policyLink} onPress={() => setShowPrivacy(true)}>
                سياسة حماية المعطيات
              </ThemedText>
            </ThemedText>
          </View>
        </View>

        {/* زر إنشاء الحساب */}
        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.submitBtnTxt}>🚀 إنشاء الحساب الآن</ThemedText>
          )}
        </Pressable>

        {/* رابط الدخول لمن يملك حساباً */}
        <View style={styles.loginLinkRow}>
          <ThemedText style={styles.loginText}>لديك حساب بالفعل؟ </ThemedText>
          <Pressable onPress={() => router.push('/auth/login')}>
            <ThemedText style={styles.loginLink}>تسجيل الدخول</ThemedText>
          </Pressable>
        </View>

        {/* Modals */}
        <PickerModal
          visible={showNiveauPicker}
          title="اختر الطور التعليمي"
          options={NIVEAUX.map((n) => ({ value: n.value, label: `${n.icon} ${n.label}` }))}
          selected={formData.niveau}
          onSelect={(val) => {
            const defaultClass = val === 'college' ? 'السنة الأولى متوسط' : 'السنة الأولى ثانوي';
            setFormData({ ...formData, niveau: val, classe: defaultClass });
          }}
          onClose={() => setShowNiveauPicker(false)}
        />

        <PickerModal
          visible={showClassePicker}
          title="اختر السنة الدراسية"
          options={currentClasseOptions}
          selected={formData.classe}
          onSelect={(val) => setFormData({ ...formData, classe: val })}
          onClose={() => setShowClassePicker(false)}
        />

        <InfoModal
          visible={showCgu}
          title="شروط الاستخدام العامة"
          content={CGU_TEXT}
          onClose={() => setShowCgu(false)}
        />

        <InfoModal
          visible={showPrivacy}
          title="سياسة الخصوصية"
          content={PRIVACY_TEXT}
          onClose={() => setShowPrivacy(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  halfField: {
    flex: 1,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  selectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  selectArrow: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  policyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  policyTextWrapper: {
    flex: 1,
  },
  policyText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'right',
  },
  policyLink: {
    color: '#059669',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  loginLinkRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  loginText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    textDecorationLine: 'underline',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  closeTxt: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  body: {
    padding: 16,
  },
  content: {
    fontSize: 13,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'right',
  },
});

const pk = StyleSheet.create({
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#ECFDF5',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#059669',
    fontWeight: '800',
  },
  checkmark: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '900',
  },
});
