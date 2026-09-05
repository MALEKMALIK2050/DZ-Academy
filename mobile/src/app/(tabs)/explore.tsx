// src/app/(tabs)/explore.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CourseCard } from '@/components/course-card';
import { PaymentModal } from '@/components/payment-modal';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  NIVEAUX,
  ANNEES_COLLEGE,
  ANNEES_LYCEE,
  MATIERES_OPTIONS,
  getMatiereLabel,
  getClasseLabel,
  getNiveauLabel,
} from '@/constants/algerian-education';

const C = {
  primary: '#059669',
  secondary: '#F97316',
  dark: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#FAF8F5',
};

interface CourseItem {
  id: number;
  title?: string;
  titre?: string;
  description?: string;
  matiere?: string;
  niveau?: string;
  annee?: string;
  prix?: number;
  chapters?: { id: number }[];
  teachers?: { id: number; nom: string; prenom: string }[];
  enrollments?: { id: number; statut: string; typePaiement: string }[];
}

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
      <Pressable style={pk.overlay} onPress={onClose} />
      <View style={pk.sheet}>
        <View style={pk.header}>
          <ThemedText style={pk.title}>{title}</ThemedText>
          <Pressable onPress={onClose}>
            <ThemedText style={pk.close}>✕</ThemedText>
          </Pressable>
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

export default function ExploreScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // فلاتر البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedAnnee, setSelectedAnnee] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');

  // Modals الاختيار
  const [showNiveauModal, setShowNiveauModal] = useState(false);
  const [showAnneeModal, setShowAnneeModal] = useState(false);
  const [showMatiereModal, setShowMatiereModal] = useState(false);

  // Modal الدفع والتسجيل السريع
  const [payCourse, setPayCourse] = useState<CourseItem | null>(null);

  // خيارات السنوات بناءً على الطور المختار
  const anneeOptions = [
    { value: '', label: 'جميع السنوات الدراسية' },
    ...(selectedNiveau === 'college'
      ? ANNEES_COLLEGE.map((a) => ({ value: a.value, label: a.label }))
      : selectedNiveau === 'lycee'
      ? ANNEES_LYCEE.map((a) => ({ value: a.value, label: a.label }))
      : [...ANNEES_COLLEGE, ...ANNEES_LYCEE].map((a) => ({ value: a.value, label: a.label }))),
  ];

  const fetchCourses = useCallback(async () => {
    try {
      setError(null);
      const url = API_ENDPOINTS.cataloguePublic({
        niveau: selectedNiveau || undefined,
        annee: selectedAnnee || undefined,
        matiere: selectedMatiere || undefined,
      });

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`خطأ ${res.status}`);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchCourses error:', err);
      setError('تعذر تحميل كتالوج الدورات التعليمية');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedNiveau, selectedAnnee, selectedMatiere, token]);

  useEffect(() => {
    setLoading(true);
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  // تصفية البحث النصي محلياً
  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const t = (c.title || c.titre || '').toLowerCase();
    const d = (c.description || '').toLowerCase();
    const m = (c.matiere || '').toLowerCase();
    return t.includes(q) || d.includes(q) || m.includes(q);
  });

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
        {/* الرأس والترحيب */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>دليل الدورات التعليمية 🔍</ThemedText>
          <ThemedText style={styles.sub}>
            دورات متوافقة 100% مع المنهاج الجزائري للتعليم المتوسط والثانوي
          </ThemedText>
        </View>

        {/* حقل البحث */}
        <View style={styles.searchBox}>
          <ThemedText style={styles.searchIcon}>🔎</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن درس، مادة، أستاذ..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <ThemedText style={styles.clearSearch}>✕</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* فلاتر المنهاج الجزائري */}
        <View style={styles.filtersWrapper}>
          <ThemedText style={styles.filtersTitle}>تصفية حسب المنهاج الجزائري :</ThemedText>
          <View style={styles.filterBtnsRow}>
            {/* فلتر الطور */}
            <Pressable
              style={[styles.filterPill, selectedNiveau && styles.filterPillActive]}
              onPress={() => setShowNiveauModal(true)}
            >
              <ThemedText style={[styles.filterPillTxt, selectedNiveau && styles.filterPillTxtActive]}>
                {selectedNiveau ? getNiveauLabel(selectedNiveau) : '🏫 الطور'}
              </ThemedText>
            </Pressable>

            {/* فلتر السنة */}
            <Pressable
              style={[styles.filterPill, selectedAnnee && styles.filterPillActive]}
              onPress={() => setShowAnneeModal(true)}
            >
              <ThemedText style={[styles.filterPillTxt, selectedAnnee && styles.filterPillTxtActive]}>
                {selectedAnnee ? getClasseLabel(selectedAnnee) : '📅 السنة'}
              </ThemedText>
            </Pressable>

            {/* فلتر المادة */}
            <Pressable
              style={[styles.filterPill, selectedMatiere && styles.filterPillActive]}
              onPress={() => setShowMatiereModal(true)}
            >
              <ThemedText style={[styles.filterPillTxt, selectedMatiere && styles.filterPillTxtActive]}>
                {selectedMatiere ? getMatiereLabel(selectedMatiere) : '📚 المادة'}
              </ThemedText>
            </Pressable>

            {/* زر إعادة الضبط */}
            {(selectedNiveau || selectedAnnee || selectedMatiere) ? (
              <Pressable
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSelectedNiveau('');
                  setSelectedAnnee('');
                  setSelectedMatiere('');
                }}
              >
                <ThemedText style={styles.resetFilterTxt}>إلغاء الكل ✕</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* نتائج البحث وقائمة الدورات */}
        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
          </View>
        ) : filteredCourses.length === 0 ? (
          <View style={styles.emptyBox}>
            <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
            <ThemedText style={styles.emptyTitle}>لا توجد نتائج مطابقة</ThemedText>
            <ThemedText style={styles.emptySub}>
              جرب تغيير معايير البحث أو اختيار طور وسنة دراسية أخرى.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.coursesList}>
            <ThemedText style={styles.resultsCount}>
              عدد الدورات المتوفرة: {filteredCourses.length}
            </ThemedText>
            {filteredCourses.map((course) => {
              const myEnrollment = course.enrollments && course.enrollments.length > 0 ? course.enrollments[0] : null;
              const isEnrolled = myEnrollment && (myEnrollment.statut === 'PAYE' || myEnrollment.statut === 'GRATUIT');
              const isPending = myEnrollment && myEnrollment.statut === 'EN_ATTENTE';

              return (
                <View key={course.id} style={styles.cardContainer}>
                  {/* شارة حالة التسجيل للتلميذ */}
                  {isEnrolled && (
                    <View style={styles.enrolledBadge}>
                      <ThemedText style={styles.enrolledBadgeText}>✓ مسجل في دورتك</ThemedText>
                    </View>
                  )}
                  {isPending && (
                    <View style={styles.pendingBadge}>
                      <ThemedText style={styles.pendingBadgeText}>⏳ قيد التحقق من الدفع</ThemedText>
                    </View>
                  )}

                  <CourseCard
                    id={course.id}
                    titre={course.title || course.titre}
                    description={course.description}
                    chaptersCount={course.chapters?.length || 0}
                    niveau={course.niveau}
                    annee={course.annee}
                    matiere={course.matiere}
                    teachers={course.teachers}
                    onPress={() => {
                      router.push({ pathname: '/course/[id]', params: { id: String(course.id) } });
                    }}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Modals الفلاتر */}
        <PickerModal
          visible={showNiveauModal}
          title="اختر الطور التعليمي"
          options={[
            { value: '', label: 'جميع الأطوار' },
            ...NIVEAUX.map((n) => ({ value: n.value, label: `${n.icon} ${n.label}` })),
          ]}
          selected={selectedNiveau}
          onSelect={(v) => {
            setSelectedNiveau(v);
            setSelectedAnnee('');
          }}
          onClose={() => setShowNiveauModal(false)}
        />

        <PickerModal
          visible={showAnneeModal}
          title="اختر السنة الدراسية"
          options={anneeOptions}
          selected={selectedAnnee}
          onSelect={setSelectedAnnee}
          onClose={() => setShowAnneeModal(false)}
        />

        <PickerModal
          visible={showMatiereModal}
          title="اختر المادة التعليمية"
          options={MATIERES_OPTIONS}
          selected={selectedMatiere}
          onSelect={setSelectedMatiere}
          onClose={() => setShowMatiereModal(false)}
        />

        {/* Modal الدفع */}
        {payCourse ? (
          <PaymentModal
            visible={!!payCourse}
            course={payCourse}
            token={token}
            onClose={() => setPayCourse(null)}
            onEnrollmentSuccess={() => {
              fetchCourses();
            }}
          />
        ) : null}
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
  searchBox: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
  },
  clearSearch: {
    fontSize: 16,
    color: '#9CA3AF',
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: 16,
    alignItems: 'stretch',
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  filterBtnsRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  filterPillTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  filterPillTxtActive: {
    color: '#059669',
    fontWeight: '800',
  },
  resetFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  resetFilterTxt: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 10,
  },
  coursesList: {
    marginTop: 6,
  },
  cardContainer: {
    position: 'relative',
  },
  enrolledBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  enrolledBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pendingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySub: {
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
    borderColor: '#FECACA',
    marginVertical: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '700',
  },
});

const pk = StyleSheet.create({
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
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
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
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  close: {
    fontSize: 18,
    color: '#9CA3AF',
    padding: 4,
  },
  option: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionSelected: {
    backgroundColor: '#ECFDF5',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
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