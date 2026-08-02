// src/app/(tabs)/profile.tsx
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { DZ_PAYMENT_CONFIG, getClasseLabel, getNiveauLabel } from '@/constants/algerian-education';

const Colors = {
  primary: '#059669',
  secondary: '#F97316',
  danger: '#DC2626',
  accent: '#2563EB',
  dark: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#FAF8F5',
};

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

const CGU_TEXT = `شروط الاستخدام العامة لمنصة دزأكاديمي (DZ Academy)

المادة 1 - نطاق التطبيق:
تنظم هذه الشروط العامة شروط وإجراءات الاستفادة من الخدمات التعليمية ومحتويات منصة دزأكاديمي.

المادة 2 - شروط التسجيل وحساب التلميذ:
• الحساب شخصي ومخصص للتلميذ المسجل حصراً.
• يجب تقديم معلومات حقيقية ودقيقة خاصة بالاسم واللقب والمستوى الدراسي.
• يتحمل التلميذ وولي أمره مسؤولية الحفاظ على سرية كلمة المرور.

المادة 3 - حماية المعطيات الشخصية (وفقاً للقانون الجزائري رقم 18-07):
• تلتزم منصة دزأكاديمي بحماية خصوصية بيانات التلاميذ وأولياء الأمور.
• تُستخدم البيانات حصراً لإدارة التمدرس والمتابعة البيداغوجية والتقييمات.`;

const PRIVACY_TEXT = `سياسة الخصوصية وحماية المعطيات

تلتزم منصة دزأكاديمي DZ Academy بالشفافية الكاملة في معالجة بيانات التلاميذ:

البيانات المجمعة:
• الهوية الأكاديمية (الاسم، اللقب، البريد الإلكتروني).
• المستوى الدراسي والطور (متوسط / ثانوي) والسنة الدراسية.
• معلومات التواصل مع ولي الأمر (للمتابعة التربوية للتلاميذ القُصّر).
• مسار التقدم في الدروس، والنتائج المحققة في الاختبارات التكوينية والنهائية.`;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [showCgu, setShowCgu] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك ؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'تلميذ دزأكاديمي';
  const initial = user?.prenom ? user.prenom.charAt(0).toUpperCase() : '🎓';
  const niveauText = getNiveauLabel(user?.niveau) || 'التعليم الجزائري';
  const classeText = getClasseLabel(user?.classe || user?.annee) || 'السنة الدراسية';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* بطاقة الحساب العلوية */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{initial}</ThemedText>
          </View>
          <ThemedText style={styles.userName}>{fullName}</ThemedText>
          <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>

          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleBadgeText}>🎓 حساب تلميذ مفعّل</ThemedText>
          </View>
        </View>

        {/* ── المعلومات الأكاديمية والتمدرس ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>📚 المسار الدراسي (المنهاج الجزائري)</ThemedText>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoVal}>{niveauText}</ThemedText>
              <ThemedText style={styles.infoLabel}>الطور التعليمي :</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoVal}>{classeText}</ThemedText>
              <ThemedText style={styles.infoLabel}>السنة الدراسية :</ThemedText>
            </View>
            {user?.ecole ? (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoVal}>{user.ecole}</ThemedText>
                  <ThemedText style={styles.infoLabel}>المؤسسة التعليمية :</ThemedText>
                </View>
              </>
            ) : null}
            {user?.telephone ? (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoVal}>{user.telephone}</ThemedText>
                  <ThemedText style={styles.infoLabel}>الهاتف :</ThemedText>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* ── المساعدة والدعم الفني ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>💬 الدعم والمساعدة</ThemedText>
          <View style={styles.infoBox}>
            <Pressable
              style={styles.actionRow}
              onPress={() => {
                const msg = encodeURIComponent(
                  `السلام عليكم، أنا التلميذ ${fullName} مسجل ببريد ${user?.email}، وأحتاج لمساعدة بخصوص الحساب.`
                );
                Linking.openURL(`https://wa.me/${DZ_PAYMENT_CONFIG.whatsapp}?text=${msg}`);
              }}
            >
              <ThemedText style={styles.actionArrow}>←</ThemedText>
              <ThemedText style={styles.actionLabel}>التواصل مع الإدارة عبر واتساب</ThemedText>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.actionRow} onPress={() => setShowCgu(true)}>
              <ThemedText style={styles.actionArrow}>←</ThemedText>
              <ThemedText style={styles.actionLabel}>شروط الاستخدام العامة</ThemedText>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.actionRow} onPress={() => setShowPrivacy(true)}>
              <ThemedText style={styles.actionArrow}>←</ThemedText>
              <ThemedText style={styles.actionLabel}>سياسة الخصوصية وحماية المعطيات</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* ── زر تسجيل الخروج ── */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <ThemedText style={styles.logoutBtnTxt}>🚪 تسجيل الخروج من الحساب</ThemedText>
        </Pressable>

        {/* Modals */}
        <InfoModal
          visible={showCgu}
          title="شروط الاستخدام العامة"
          content={CGU_TEXT}
          onClose={() => setShowCgu(false)}
        />

        <InfoModal
          visible={showPrivacy}
          title="سياسة الخصوصية وحماية المعطيات"
          content={PRIVACY_TEXT}
          onClose={() => setShowPrivacy(false)}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 16 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionArrow: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.danger,
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
    maxHeight: '80%',
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
