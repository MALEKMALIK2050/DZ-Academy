// src/app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  Image,
  Modal,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoadingScreen } from '@/components/loading-screen';
import { CourseCard } from '@/components/course-card';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getClasseLabel, getNiveauLabel } from '@/constants/algerian-education';

const C = {
  primary: '#059669',
  secondary: '#F97316',
  blue: '#2563EB',
  amber: '#D97706',
  red: '#DC2626',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
  bg: '#FAF8F5',
};

interface Enrollment {
  id: number;
  statut: 'EN_ATTENTE' | 'PAYE' | 'GRATUIT' | 'REJETE';
  progression: number;
  completed: boolean;
  typePaiement: string;
  course: {
    id: number;
    title?: string;
    titre?: string;
    description?: string;
    matiere?: string;
    niveau?: string;
    annee?: string;
    chapters?: { id: number }[];
    teachers?: { id: number; nom: string; prenom: string }[];
  };
  cooldownLocked?: boolean;
  lockedUntil?: string;
}

export default function MesCoursScreen() {
  const { user, token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Modal رفع وصل الدفع للدورات المعلقة ──
  const [preuveModalEnrollment, setPreuveModalEnrollment] = useState<Enrollment | null>(null);
  const [preuveAsset, setPreuveAsset] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API_ENDPOINTS.studentCourses, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) throw new Error(`خطأ ${res.status}`);
      const data = await res.json();
      setEnrollments(Array.isArray(data.enrollments) ? data.enrollments : []);
    } catch (err) {
      console.error('fetchEnrollments error:', err);
      setError('تعذر تحميل دوراتك التعليمية حالياً');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnrollments();
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setPreuveAsset({
        uri: res.assets[0].uri,
        type: res.assets[0].mimeType || 'image/jpeg',
        name: res.assets[0].fileName || 'recu.jpg',
      });
    }
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setPreuveAsset({
        uri: res.assets[0].uri,
        type: res.assets[0].mimeType || 'application/pdf',
        name: res.assets[0].name || 'recu.pdf',
      });
    }
  };

  const handleUploadPreuve = async () => {
    if (!preuveAsset || !preuveModalEnrollment) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('enrollmentId', String(preuveModalEnrollment.id));
      formData.append('courseId', String(preuveModalEnrollment.course.id));

      if (Platform.OS === 'web') {
        const fetchBlob = await fetch(preuveAsset.uri);
        const blob = await fetchBlob.blob();
        formData.append('preuve', blob, preuveAsset.name);
      } else {
        formData.append('preuve', {
          uri: preuveAsset.uri,
          type: preuveAsset.type,
          name: preuveAsset.name,
        } as any);
      }

      const res = await fetch(API_ENDPOINTS.uploadPreuve, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('فشل رفع الوصل');

      Alert.alert('تم بنجاح', 'تم استلام وصل الدفع، وسيتم تفعيل الدورة بعد التدقيق.');
      setPreuveModalEnrollment(null);
      setPreuveAsset(null);
      fetchEnrollments();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر إرسال الوصل');
    } finally {
      setUploading(false);
    }
  };

  const actifs = enrollments.filter((e) => e.statut === 'PAYE' || e.statut === 'GRATUIT');
  const enAttente = enrollments.filter((e) => e.statut === 'EN_ATTENTE');

  if (loading) {
    return <LoadingScreen message="جاري تحميل دوراتك المسجلة..." />;
  }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* الترحيب ورأس الصفحة */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>دوراتي التعليمية 📚</ThemedText>
          <ThemedText style={styles.sub}>
            مرحباً بك {user?.prenom || 'يا بطل'} ! واصل التعلم وحقق التفوق.
          </ThemedText>
        </View>

        {/* إحصائيات سريعة */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <ThemedText style={[styles.statNum, { color: C.primary }]}>{actifs.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: C.primary }]}>دورات نشطة</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <ThemedText style={[styles.statNum, { color: C.amber }]}>{enAttente.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: C.amber }]}>قيد المراجعة</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <ThemedText style={[styles.statNum, { color: C.blue }]}>
              {actifs.length > 0
                ? `${Math.round(actifs.reduce((acc, c) => acc + (c.progression || 0), 0) / actifs.length)}%`
                : '0%'}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: C.blue }]}>معدل الإنجاز</ThemedText>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
          </View>
        ) : null}

        {/* ── الدورات قيد مراجعة الدفع ── */}
        {enAttente.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>⏳ طلبات قيد تأكيد الدفع</ThemedText>
            </View>
            {enAttente.map((e) => (
              <View key={e.id} style={styles.pendingCard}>
                <View style={styles.pendingTop}>
                  <ThemedText style={styles.pendingTitle} numberOfLines={1}>
                    {e.course.title || e.course.titre}
                  </ThemedText>
                  <View style={styles.badgePending}>
                    <ThemedText style={styles.badgePendingText}>قيد المراجعة</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.pendingDesc}>
                  تم استلام طلب التسجيل. يرجى إرفاق وصل الدفع عبر بريدي موب أو CCP لتسريع التفعيل.
                </ThemedText>
                <Pressable
                  style={styles.uploadPreuveBtn}
                  onPress={() => {
                    setPreuveModalEnrollment(e);
                    setPreuveAsset(null);
                  }}
                >
                  <ThemedText style={styles.uploadPreuveBtnText}>📎 إرفاق وصل الدفع</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── الدورات النشطة ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>📖 دوراتي النشطة</ThemedText>
          </View>

          {actifs.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyIcon}>🎓</ThemedText>
              <ThemedText style={styles.emptyTitle}>لا توجد دورات نشطة بعد</ThemedText>
              <ThemedText style={styles.emptySub}>
                تصفح دليل الدورات في المنهاج الجزائري وسجل في المواد التي ترغب في التفوق فيها!
              </ThemedText>
              <Pressable style={styles.exploreBtn} onPress={() => router.push('/(tabs)/explore')}>
                <ThemedText style={styles.exploreBtnText}>استكشف الدورات الآن 🔍</ThemedText>
              </Pressable>
            </View>
          ) : (
            actifs.map((e) => (
              <CourseCard
                key={e.id}
                id={e.course.id}
                titre={e.course.title || e.course.titre}
                progress={e.progression || 0}
                chaptersCount={e.course.chapters?.length || 0}
                niveau={e.course.niveau}
                annee={e.course.annee}
                matiere={e.course.matiere}
                teachers={e.course.teachers}
              />
            ))
          )}
        </View>

        {/* نافذة رفع الوصل للدورة المعلقة */}
        <Modal
          visible={!!preuveModalEnrollment}
          transparent
          animationType="slide"
          onRequestClose={() => setPreuveModalEnrollment(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setPreuveModalEnrollment(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setPreuveModalEnrollment(null)}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </Pressable>
              <ThemedText style={styles.modalTitle}>إرفاق وصل الدفع 🧾</ThemedText>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <ThemedText style={styles.modalSubTitle}>
                الدورة: {preuveModalEnrollment?.course.title || preuveModalEnrollment?.course.titre}
              </ThemedText>

              {preuveAsset ? (
                <View style={styles.assetPreview}>
                  {preuveAsset.type.startsWith('image/') ? (
                    <Image source={{ uri: preuveAsset.uri }} style={styles.assetImg} resizeMode="contain" />
                  ) : (
                    <View style={styles.pdfBadge}>
                      <ThemedText style={{ fontSize: 32 }}>📄</ThemedText>
                      <ThemedText style={{ fontSize: 13, color: '#334155' }}>{preuveAsset.name}</ThemedText>
                    </View>
                  )}
                  <Pressable style={styles.removeBtn} onPress={() => setPreuveAsset(null)}>
                    <ThemedText style={styles.removeBtnTxt}>إلغاء الملف</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pickerBtnsRow}>
                  <Pressable style={styles.pickerBtn} onPress={pickImage}>
                    <ThemedText style={styles.pickerBtnTxt}>🖼️ صورة من المعرض</ThemedText>
                  </Pressable>
                  <Pressable style={styles.pickerBtn} onPress={pickDocument}>
                    <ThemedText style={styles.pickerBtnTxt}>📄 ملف PDF</ThemedText>
                  </Pressable>
                </View>
              )}

              <Pressable
                style={[
                  styles.confirmUploadBtn,
                  (!preuveAsset || uploading) && { opacity: 0.5 },
                ]}
                disabled={!preuveAsset || uploading}
                onPress={handleUploadPreuve}
              >
                <ThemedText style={styles.confirmUploadBtnTxt}>
                  {uploading ? 'جاري الرفع...' : 'تأكيد وإرسال الوصل'}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 16 },
  header: {
    marginVertical: 14,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  sub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    alignItems: 'stretch',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  pendingTop: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  pendingDesc: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    lineHeight: 18,
    marginBottom: 10,
  },
  uploadPreuveBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadPreuveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  exploreBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalClose: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 14,
  },
  pickerBtnsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 16,
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  assetPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  assetImg: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  pdfBadge: {
    alignItems: 'center',
    padding: 16,
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  removeBtnTxt: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  confirmUploadBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmUploadBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});