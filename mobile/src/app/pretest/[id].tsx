// src/app/pretest/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, I18nManager } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { LoadingScreen } from '@/components/loading-screen';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, Spacing } from '@/constants/theme';

const C = {
  primary: '#059669',
  secondary: '#F97316',
  blue: '#2563EB',
  danger: '#DC2626',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#FAF8F5',
};

interface Question {
  id: number;
  texte: string;
  choix: string[];
}

export default function PretestScreen() {
  const { id: courseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    pourcentage: number;
    feedback?: {
      level: string;
      color?: string;
      message: string;
    };
  } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchPretest();
  }, [courseId]);

  const fetchPretest = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.courseDetail(courseId as string), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بالخادم');

      const pretestQuestions = data.pretest?.questions || data.pretest?.أسئلة || [];
      setQuestions(pretestQuestions);
    } catch (error: any) {
      Alert.alert('تنبيه', error.message || 'تعذر جلب أسئلة الاختبار التشخيصي');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const missingCount = questions.length - answeredCount;
      Alert.alert(
        'أسئلة غير مجاب عنها',
        `تبقى لديك ${missingCount} أسئلة لم تجب عليها. هل تريد الإرسال على أية حال؟`,
        [
          { text: 'مواصلة الحل', style: 'cancel' },
          { text: 'تأكيد الإرسال', onPress: sendPretest },
        ]
      );
      return;
    }

    sendPretest();
  };

  const sendPretest = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.pretestSubmit(courseId as string), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reponses: answers, answers }),
      });

      const resJson = await response.json();
      const resData = resJson.data || resJson;

      if (response.ok) {
        const score = resData.correct ?? resData.score ?? 0;
        const total = resData.total || questions.length;
        const percentage = resData.percentage ?? resData.pourcentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);

        let feedback = resData.feedback;
        if (!feedback) {
          if (percentage < 20) {
            feedback = {
              level: 'critique',
              message: 'مُحاولة طَيّبة! يُستحسن أن تراجع الأساسيات والمكتسبات في دروس السنوات السابقة لتتمكن من متابعة هذا الدرس بتمكن.',
            };
          } else if (percentage <= 50) {
            feedback = {
              level: 'faible',
              message: 'أنت مستعد لمتابعة هذه الدورة بنجاح! تم فتح دروس الفصل الأول، بالتوفيق!',
            };
          } else {
            feedback = {
              level: 'bon',
              message: 'أحسنت! إنك جاهز ومستعد تماماً لمتابعة هذا الدرس واستيعابه بنجاح باهر! تم فتح دروس الفصل الأول.',
            };
          }
        }

        setResult({
          score,
          total,
          pourcentage: percentage,
          feedback,
        });
      } else {
        Alert.alert('تنبيه', resJson.error || 'تعذر إرسال النتيجة، يرجى إعادة المحاولة.');
      }
    } catch (error) {
      console.error('Pretest submit error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الإجابات، يرجى إعادة المحاولة.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="جاري إعداد اختبار تشخيص المكتسبات القبلية..." />;
  }

  if (questions.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>🎯</ThemedText>
        <ThemedText style={styles.title}>لا يوجد اختبار تشخيصي مخصص لهذه الدورة</ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>العودة للدورة</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'اختبار تشخيص المكتسبات القبلية',
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
        showsVerticalScrollIndicator={false}
      >
        {result ? (
          /* ── شاشة النتيجة والتغذية الراجعة البيداغوجية ── */
          <View style={styles.resultCard}>
            <View
              style={[
                styles.scoreCircle,
                {
                  backgroundColor:
                    result.pourcentage < 20 ? '#DC2626' : result.pourcentage <= 50 ? '#D97706' : '#059669',
                },
              ]}
            >
              <ThemedText style={styles.scoreNumber}>{result.pourcentage}%</ThemedText>
              <ThemedText style={styles.scoreSubText}>
                {result.score} من {result.total} صحيحة
              </ThemedText>
            </View>

            <ThemedText style={styles.resultTitle}>
              {result.pourcentage >= 50
                ? '✅ أحسنت ! تم تقييم مستواك وفتح الفصل الأول'
                : result.pourcentage >= 20
                ? '👍 تم تقييم مستواك وفتح الفصل الأول'
                : '⚠️ تقييم المستوى الأولي'}
            </ThemedText>

            <View style={styles.feedbackBox}>
              <ThemedText style={styles.resultAdvice}>
                {result.feedback?.message ||
                  (result.pourcentage >= 50
                    ? 'أحسنت! إنك جاهز ومستعد تماماً لمتابعة هذا الدرس واستيعابه بنجاح باهر! تم فتح دروس الفصل الأول.'
                    : 'مُحاولة طَيّبة! يُستحسن أن تراجع الأساسيات والمكتسبات السابقة لمتابعة هذا الدرس بتفوق.')}
              </ThemedText>
            </View>

            <Pressable style={styles.confirmBtn} onPress={() => router.back()}>
              <ThemedText style={styles.confirmBtnTxt}>🚀 الدخول إلى الفصل الأول ←</ThemedText>
            </Pressable>

            <Pressable
              style={styles.retryTestBtn}
              onPress={() => {
                setResult(null);
                setAnswers({});
                setCurrentQuestionIndex(0);
              }}
            >
              <ThemedText style={styles.retryTestBtnTxt}>🔄 إعادة الاختبار التشخيصي</ThemedText>
            </Pressable>
          </View>
        ) : (
          /* ── ورقة الأسئلة ── */
          <>
            <View style={styles.progressRow}>
              <ThemedText style={styles.progressText}>
                {`\u200Fالسؤال ${currentQuestionIndex + 1} من ${questions.length}\u200F`}
              </ThemedText>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.questionCard}>
              <ThemedText style={styles.questionText}>{currentQ.texte}</ThemedText>

              <View style={styles.optionsList}>
                {(currentQ.choix || []).map((choix, index) => {
                  const isSelected = answers[currentQ.id] === choix;
                  return (
                    <Pressable
                      key={index}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => handleSelect(currentQ.id, choix)}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {choix}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* أزرار التنقل بين الأسئلة (السابق على اليمين والتالي على اليسار) */}
            <View style={styles.navRow}>
              {/* الزر الأيمن: السابق */}
              {currentQuestionIndex > 0 ? (
                <Pressable style={styles.navBtn} onPress={handlePreviousQuestion}>
                  <ThemedText style={styles.navBtnTxt}>السابق →</ThemedText>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {/* الزر الأيسر: التالي أو إرسال النتيجة */}
              {isLastQuestion ? (
                <Pressable
                  style={[styles.navBtn, styles.submitBtn, submitting && { opacity: 0.7 }]}
                  disabled={submitting}
                  onPress={handleSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText style={styles.submitBtnTxt}>إرسال النتيجة ✓</ThemedText>
                  )}
                </Pressable>
              ) : (
                <Pressable style={[styles.navBtn, styles.nextBtn]} onPress={handleNextQuestion}>
                  <ThemedText style={styles.nextBtnTxt}>← التالي</ThemedText>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { paddingHorizontal: 16 },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  progressRow: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'right',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    lineHeight: 24,
    marginBottom: 18,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  optionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  navRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  navBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  nextBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  submitBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  scoreSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 2,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    width: '100%',
  },
  resultAdvice: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  confirmBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  confirmBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  retryTestBtn: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  retryTestBtnTxt: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 13,
  },
});