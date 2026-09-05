// src/app/course/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoadingScreen } from '@/components/loading-screen';
import { PaymentModal } from '@/components/payment-modal';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS, API_URL } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  getMatiereStyles,
  getSubjectIcon,
  getClasseLabel,
  getNiveauLabel,
  getMatiereLabel,
} from '@/constants/algerian-education';

const C = {
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#ECFDF5',
  secondary: '#F97316',
  secondaryLight: '#FFF7ED',
  blue: '#2563EB',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#EAB308',
  gray: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
  bg: '#FAF8F5',
};

const htmlTagsStyles = {
  body: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    color: '#374151',
    fontSize: 14,
    lineHeight: 24,
  },
  p: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    color: '#374151',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 8,
  },
  div: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    color: '#374151',
    fontSize: 14,
    lineHeight: 24,
  },
  span: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  strong: {
    color: '#111827',
    fontWeight: '800' as const,
  },
  li: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
};

interface QuizInfo {
  id: number;
  type: string;
}

interface Chapter {
  id: number;
  title?: string;
  titre?: string;
  description?: string;
  objectifs?: string;
  ordre?: number;
  isLocked?: boolean;
  quiz?: QuizInfo;
  quizScore?: number;
  quizCompleted?: boolean;
  requiresPayment?: boolean;
}

interface CourseDetail {
  id: number;
  title?: string;
  titre?: string;
  description?: string;
  objectifs?: string;
  matiere?: string;
  niveau?: string;
  annee?: string;
  prix?: number;
  chapters?: Chapter[];
  hasPretest?: boolean;
  isPretestDone?: boolean;
  isFinalQuizLocked?: boolean;
  quizFinal?: QuizInfo;
  pretest?: any;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // مستويات الوصول للدورة (Freemium): 'FULL' | 'FREE_TRIAL' | 'PAYWALL' | 'LOCKED' | null
  const [accessLevel, setAccessLevel] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ── حساب القيود والشروط للفصول والاختبار الختامي ──
  const calculateChapterLocks = (
    courseData: CourseDetail,
    currentAccessLevel: string | null
  ): { chapters: Chapter[]; isFinalLocked: boolean } => {
    if (!courseData.chapters) {
      return { chapters: [], isFinalLocked: true };
    }

    const chapters = courseData.chapters;
    const isPretestDone = courseData.isPretestDone || false;

    // 1. Accès complet (مسجل + دفع كامل)
    const isFull = currentAccessLevel === 'FULL' || currentAccessLevel === null;
    // 2. تجربة مجانية (الفصل الأول فقط متاح)
    const isFreeTrial = currentAccessLevel === 'FREE_TRIAL';
    // 3. جدار الدفع بعد إكمال الفصل الأول في الوضع المجاني
    const isPaywall = currentAccessLevel === 'PAYWALL';

    const processedChapters: Chapter[] = [];
    for (let index = 0; index < chapters.length; index++) {
      const chapter = chapters[index];

      // ─── الفصل الأول ───
      if (index === 0) {
        const hasPretest = courseData.hasPretest !== undefined ? courseData.hasPretest : !!courseData.pretest;
        // إذا كان هناك اختبار مكتسبات قبلية، يُقفل الفصل 1 حتى يجتازه التلميذ
        processedChapters.push({
          ...chapter,
          isLocked: hasPretest && !isPaywall ? !isPretestDone : false,
          requiresPayment: false,
        });
        continue;
      }

      // ─── الفصول من 2 فما فوق ───
      // قاعدة الفريميوم: في حالة التجربة المجانية أو جدار الدفع، الفصول 2+ مقفلة وتتطلب اشتراكاً
      if (isFreeTrial || isPaywall) {
        processedChapters.push({
          ...chapter,
          isLocked: true,
          requiresPayment: true,
        });
        continue;
      }

      // في حالة الوصول الكامل: الفتح التتابعي المشروط بنجاح اختبار الفصل السابق (علامة >= 75%)
      const prevOriginal = chapters[index - 1];
      const prevProcessed = processedChapters[index - 1];
      const hasPrevQuiz = !!prevOriginal?.quiz;
      const prevQuizScore = prevOriginal?.quizScore || 0;
      const prevQuizCompleted = prevOriginal?.quizCompleted || false;
      const isPrevQuizPassed = hasPrevQuiz ? (prevQuizCompleted && prevQuizScore >= 75) : true;

      const isLocked = prevProcessed.isLocked || !isPrevQuizPassed;

      processedChapters.push({
        ...chapter,
        isLocked,
        requiresPayment: false,
      });
    }

    // ─── الاختبار الختامي الشامل (Test Sommatif) ───
    // يُفتح حصراً إذا كان الوصول كاملاً، وآخر فصل مفتوح، وتم اجتياز اختباره التكويني بنجاح (>= 75%)
    const lastChapter = processedChapters[processedChapters.length - 1];
    const hasLastQuiz = !!lastChapter?.quiz;
    const isLastPassed = hasLastQuiz ? (lastChapter?.quizCompleted && (lastChapter?.quizScore || 0) >= 75) : true;
    const isFinalLocked = isFreeTrial || isPaywall || !!lastChapter?.isLocked || !isLastPassed;

    return {
      chapters: processedChapters,
      isFinalLocked,
    };
  };

  const fetchCourseDetails = async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch(API_ENDPOINTS.courseDetail(id as string), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`خطأ ${res.status}`);
      const data: CourseDetail = await res.json();

      // حساب حالة اختبار المكتسبات القبلية
      data.hasPretest = !!data.pretest || !!data.hasPretest;

      // 1. التحقق من إكمال اختبار المكتسبات القبلية
      if (data.pretest && (data.pretest.completed === true || data.pretest.passed === true)) {
        data.isPretestDone = true;
      }
      if (data.pretest && data.pretest.id && !data.isPretestDone) {
        try {
          const resResult = await fetch(`${API_URL}/api/pretest/${data.pretest.id}/result?courseId=${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resResult.ok) {
            const resultData = await resResult.json();
            if (resultData && resultData.id) {
              data.isPretestDone = true;
            }
          }
        } catch {}
      }

      // 2. استرجاع نتائج الاختبارات التكوينية لكل الفصول
      if (data.chapters && data.chapters.length > 0) {
        const quizPromises = data.chapters.map(async (chapter: any) => {
          if (chapter.quiz && chapter.quiz.id) {
            try {
              const qRes = await fetch(`${API_URL}/api/student/quiz?quizId=${chapter.quiz.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (qRes.ok) {
                const qData = await qRes.json();
                chapter.quizScore = qData.bestScore || (qData.score !== undefined ? qData.score : 0);
                chapter.quizCompleted = qData.dejaReussi || (chapter.quizScore >= 75);
              }
            } catch {}
          }
          return chapter;
        });
        await Promise.all(quizPromises);
      }

      // 3. التحقق من صلاحية الوصول (Freemium Access-Check)
      let level: string = 'FULL';
      try {
        const accessRes = await fetch(API_ENDPOINTS.accessCheck(id as string), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (accessRes.ok) {
          const accessData = await accessRes.json();
          level = accessData.accessLevel || 'FULL';
          setAccessLevel(level);

          if (accessData.coursePrix !== undefined) {
            data.prix = accessData.coursePrix;
          }

          if (level === 'LOCKED') {
            Alert.alert(
              'دورة تتطلب اشتراكاً 🔒',
              'هذه الدورة تتطلب اشتراكاً مسبقاً. يمكنك التسجيل فيها وتأكيد الدفع عبر الكتالوج.',
              [{ text: 'حسناً', onPress: () => router.back() }]
            );
            return;
          }

          if (level === 'PAYWALL') {
            setShowPaymentModal(true);
          }
        }
      } catch {}

      // 4. تطبيق القيود وتحديث الحالة
      const { chapters: finalChapters, isFinalLocked } = calculateChapterLocks(data, level);

      setCourse({
        ...data,
        hasPretest: !!data.pretest || !!data.hasPretest,
        chapters: finalChapters,
        isFinalQuizLocked: isFinalLocked,
      });
    } catch (err: any) {
      console.error('Course details fetch error:', err);
      setError('تعذر تحميل محتوى الدورة، يرجى إعادة المحاولة.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCourseDetails();
  }, [id, token]);

  // تحديث تلقائي عند الرجوع للصفحة (مثلاً بعد إكمال الاختبار التكويني أو اختبار المكتسبات)
  useFocusEffect(
    useCallback(() => {
      fetchCourseDetails();
    }, [id, token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourseDetails();
  };

  const handleChapterPress = (chapter: Chapter, index: number) => {
    if (chapter.requiresPayment) {
      setShowPaymentModal(true);
      return;
    }
    if (chapter.isLocked) {
      if (index === 0 && course?.hasPretest && !course?.isPretestDone) {
        Alert.alert(
          'تنبيه بيداغوجي 🎯',
          'يجب اجتياز اختبار المكتسبات القبلية أولاً لفتح دروس هذا الفصل.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'بدء الاختبار القبلي',
              onPress: () => router.push({ pathname: '/pretest/[id]', params: { id: String(course.id) } }),
            },
          ]
        );
      } else {
        Alert.alert(
          'الفصل مغلق 🔒',
          'يرجى اجتياز اختبار الفصل السابق بنسبة نجاح 75% على الأقل لفتح هذا الفصل.'
        );
      }
      return;
    }
    router.push({ pathname: '/chapter/[id]', params: { id: String(chapter.id) } });
  };

  if (loading) {
    return <LoadingScreen message="جاري إعداد محتوى الدورة التعليمية..." />;
  }

  if (error || !course) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>⚠️</ThemedText>
        <ThemedText style={styles.errorTitle}>{error || 'الدورة غير متوفرة'}</ThemedText>
        <Pressable style={styles.retryBtn} onPress={fetchCourseDetails}>
          <ThemedText style={styles.retryBtnTxt}>إعادة المحاولة</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const courseTitle = course.title || course.titre || 'الدورة التعليمية';
  const stylesSubject = getMatiereStyles(course.matiere || courseTitle);
  const icon = getSubjectIcon(course.matiere || courseTitle);
  const chapters = course.chapters || [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: courseTitle,
          headerBackTitle: 'الرجوع',
          headerTitleAlign: 'center',
          headerTintColor: '#059669',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <ThemedText style={{ fontSize: 24, color: '#059669', fontWeight: 'bold' }}>→</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* بطاقة الرأس والبانر */}
        <View style={[styles.banner, { backgroundColor: stylesSubject.background, borderColor: stylesSubject.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: stylesSubject.color }]}>
            <ThemedText style={styles.iconText}>{icon}</ThemedText>
          </View>
          <ThemedText style={styles.courseHeaderTitle}>{courseTitle}</ThemedText>

          {/* وسوم المنهاج الجزائري */}
          <View style={styles.tagsRow}>
            {course.matiere ? (
              <View style={[styles.tag, { backgroundColor: stylesSubject.background }]}>
                <ThemedText style={[styles.tagText, { color: stylesSubject.color }]}>
                  {getMatiereLabel(course.matiere)}
                </ThemedText>
              </View>
            ) : null}
            {course.annee ? (
              <View style={[styles.tag, styles.tagClasse]}>
                <ThemedText style={styles.tagClasseText}>{getClasseLabel(course.annee)}</ThemedText>
              </View>
            ) : null}
            {course.niveau ? (
              <View style={[styles.tag, styles.tagNiveau]}>
                <ThemedText style={styles.tagNiveauText}>{getNiveauLabel(course.niveau)}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── اختبار المكتسبات القبلية (Pretest) ── */}
        {(course.hasPretest || !!course.pretest) ? (
          <View style={styles.pretestCard}>
            <View style={styles.pretestHeader}>
              <ThemedText style={styles.pretestIcon}>🎯</ThemedText>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={styles.pretestTitle}>اختبار تشخيص المكتسبات القبلية</ThemedText>
                <ThemedText style={styles.pretestDesc}>
                  {course.isPretestDone
                    ? '✓ أحسنت ! تم اجتياز الاختبار التشخيصي بنجاح.'
                    : 'يجب إجراء هذا الاختبار التشخيصي القصير لتحديد مستواك وفتح الفصل الأول.'}
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[
                styles.pretestBtn,
                course.isPretestDone && { backgroundColor: '#059669' },
              ]}
              onPress={() => router.push({ pathname: '/pretest/[id]', params: { id: String(course.id) } })}
            >
              <ThemedText style={styles.pretestBtnTxt}>
                {course.isPretestDone ? 'مراجعة نتيجة الاختبار التشخيصي ←' : '🚀 بدء الاختبار التشخيصي ←'}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* ── الأهداف والوصف البيداغوجي ── */}
        {course.objectifs || course.description ? (
          <View style={styles.infoCard}>
            <ThemedText style={styles.sectionTitle}>🎯 الأهداف والمحتوى</ThemedText>
            {course.objectifs ? (
              <RenderHTML
                contentWidth={width - 48}
                tagsStyles={htmlTagsStyles}
                source={{ html: `<div style="direction: rtl; text-align: right; font-size: 14px; line-height: 24px; color: #374151;">${course.objectifs}</div>` }}
              />
            ) : null}
            {course.description ? (
              <RenderHTML
                contentWidth={width - 48}
                tagsStyles={htmlTagsStyles}
                source={{
                  html: `<div style="direction: rtl; text-align: right; font-size: 14px; line-height: 24px; color: #374151;">${
                    (course.description || '').replace(/^(<p>)?\s*<br\s*\/?>\s*/gi, '<p>')
                  }</div>`,
                }}
              />
            ) : null}
          </View>
        ) : null}

        {/* ── قائمة الفصول والدروس بالفتح التتابعي ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ThemedText style={styles.chaptersCount}>({chapters.length} فصول)</ThemedText>
            <ThemedText style={styles.sectionTitle}>📖 منهاج وفصول الدورة</ThemedText>
          </View>

          {chapters.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>لم تتم إضافة فصول لهذه الدورة بعد.</ThemedText>
            </View>
          ) : (
            chapters.map((chapter, idx) => {
              const chTitle = chapter.title || chapter.titre || `الفصل ${idx + 1}`;
              const isLocked = chapter.isLocked;
              const reqPay = chapter.requiresPayment;

              return (
                <Pressable
                  key={chapter.id}
                  style={({ pressed }) => [
                    styles.chapterItem,
                    isLocked && styles.chapterItemLocked,
                    reqPay && styles.chapterItemPaywall,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => handleChapterPress(chapter, idx)}
                >
                  <View style={styles.chapterAction}>
                    {reqPay ? (
                      <View style={styles.payBadge}>
                        <ThemedText style={styles.payBadgeText}>🔒 يحتاج اشتراك</ThemedText>
                      </View>
                    ) : isLocked ? (
                      <ThemedText style={{ fontSize: 18 }}>🔒</ThemedText>
                    ) : chapter.quizCompleted ? (
                      <View style={styles.completedBadge}>
                        <ThemedText style={styles.completedBadgeText}>
                          ✓ {chapter.quizScore !== undefined ? `${chapter.quizScore}%` : 'ناجح'}
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.openArrow}>←</ThemedText>
                    )}
                  </View>

                  <View style={styles.chapterInfo}>
                    <ThemedText style={styles.chapterTitle} numberOfLines={2}>
                      {idx + 1}. {chTitle}
                    </ThemedText>
                    {chapter.quiz ? (
                      <ThemedText style={styles.quizTag}>
                        📝 اختبار تكويني (يشترط 75% لفتح الفصل الموالي)
                      </ThemedText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* ── الاختبار النهائي الشامل (Test Sommatif) ── */}
        {course.quizFinal ? (
          <View style={styles.finalQuizCard}>
            <View style={styles.finalQuizHeader}>
              <ThemedText style={{ fontSize: 32 }}>🏆</ThemedText>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={styles.finalQuizTitle}>الاختبار الختامي الشامل (Test Sommatif)</ThemedText>
                <ThemedText style={styles.finalQuizDesc}>
                  تقييم نهائي يشمل كامل البرنامج للحصول على شهادة التفوق في المنهاج الجزائري.
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[
                styles.finalQuizBtn,
                course.isFinalQuizLocked && { opacity: 0.5, backgroundColor: '#9CA3AF' },
              ]}
              disabled={course.isFinalQuizLocked}
              onPress={() => {
                if (course.quizFinal?.id) {
                  router.push({ pathname: '/quiz/[id]', params: { id: String(course.quizFinal.id) } });
                }
              }}
            >
              <ThemedText style={styles.finalQuizBtnTxt}>
                {course.isFinalQuizLocked ? '🔒 يُفتح بعد إكمال كافة الفصول بنجاح (75%)' : 'بدء الاختبار النهائي 🏆'}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* Modal الدفع والتسجيل الجزائري */}
        {showPaymentModal ? (
          <PaymentModal
            visible={showPaymentModal}
            course={course}
            token={token}
            onClose={() => setShowPaymentModal(false)}
            onEnrollmentSuccess={() => {
              fetchCourseDetails();
            }}
          />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { paddingHorizontal: 16 },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  iconText: {
    fontSize: 32,
  },
  courseHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    marginBottom: 10,
    lineHeight: 28,
  },
  tagsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagClasse: {
    backgroundColor: '#F3F4F6',
  },
  tagClasseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  tagNiveau: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tagNiveauText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  pretestCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pretestHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pretestIcon: {
    fontSize: 32,
  },
  pretestTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E40AF',
    textAlign: 'right',
  },
  pretestDesc: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 18,
  },
  pretestBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pretestBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chaptersCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
  },
  chapterItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chapterItemLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  chapterItemPaywall: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  chapterInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
  },
  quizTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 4,
  },
  chapterAction: {
    alignItems: 'center',
  },
  payBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  openArrow: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '800',
  },
  finalQuizCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  finalQuizHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  finalQuizTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400E',
    textAlign: 'right',
  },
  finalQuizDesc: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'right',
    lineHeight: 18,
    marginTop: 2,
  },
  finalQuizBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  finalQuizBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});