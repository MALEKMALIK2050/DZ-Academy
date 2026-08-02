// src/app/quiz/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoadingScreen } from '@/components/loading-screen';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const C = {
  primary: '#059669',
  primaryDark: '#047857',
  secondary: '#F97316',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#DCFCE7',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#FAF8F5',
};

interface Question {
  id: string | number;
  texte: string;
  choix: string[];
  reponse?: string;
  points?: number;
}

interface QuizDetail {
  id: string | number;
  titre?: string;
  title?: string;
  description?: string;
  type?: 'FORMATIF' | 'SOMMATIF';
  questions: Question[];
  passingScore?: number;
  durationMinutes?: number;
  courseId?: string | number;
  chapterId?: string | number;
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    correct: number;
    seuil: number;
    passed: boolean;
    message?: string;
    corrections?: any[];
  } | null>(null);

  const [showCorrections, setShowCorrections] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // المؤقت التنازلي للاختبار
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    if (timeLeft === 1) {
      Alert.alert('انتهى الوقت ⏳', 'انتهى الوقت المخصص للاختبار، سيتم تسليم إجاباتك الحالية تلقائياً.', [
        { text: 'حسناً', onPress: () => confirmSubmit() },
      ]);
    }

    return () => clearTimeout(timerId);
  }, [timeLeft, submitted]);

  // تنسيق الوقت mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // حماية من الخروج غير المقصود أثناء حل الأسئلة
  useEffect(() => {
    const backAction = () => {
      if (!submitted && Object.keys(selectedAnswers).length > 0) {
        Alert.alert('تنبيه الخروج', 'هل أنت متأكد من مغادرة الاختبار؟ سيتم فقدان إجاباتك غير المؤكدة.', [
          { text: 'البقاء في الاختبار', style: 'cancel' },
          { text: 'مغادرة', style: 'destructive', onPress: () => router.back() },
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [submitted, selectedAnswers]);

  const fetchQuiz = async () => {
    try {
      setError(null);
      const res = await fetch(API_ENDPOINTS.quizGet(id as string), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`خطأ ${res.status}`);
      const data = await res.json();
      const qz = data.quiz || data;
      setQuiz(qz);

      // تفعيل المؤقت إذا كان للاختبار مدة محددة
      if (qz.durationMinutes && qz.durationMinutes > 0) {
        setTimeLeft(qz.durationMinutes * 60);
      }
    } catch (err: any) {
      console.error('fetchQuiz error:', err);
      setError('تعذر تحميل أسئلة الاختبار حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const handleSelectOption = (questionId: string | number, option: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !quiz.questions) return;

    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < quiz.questions.length) {
      const missingCount = quiz.questions.length - answeredCount;
      Alert.alert(
        'أسئلة متبقية',
        `لقد أجبت على ${answeredCount} من أصل ${quiz.questions.length} أسئلة. تتبقى لديك ${missingCount} أسئلة. هل تود التأكيد والإرسال؟`,
        [
          { text: 'مواصلة الحل', style: 'cancel' },
          { text: 'إرسال على أية حال', onPress: confirmSubmit },
        ]
      );
      return;
    }

    confirmSubmit();
  };

  const confirmSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.quizSubmit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: Number(quiz.id),
          answers: selectedAnswers,
        }),
      });

      const data = await res.json();
      const seuil = data.seuil || quiz.passingScore || 75;

      if (res.ok && data.success) {
        const score = data.score !== undefined ? data.score : 0;
        const total = data.total || quiz.questions.length;
        const correct = data.correct !== undefined ? data.correct : Math.round((score / 100) * total);
        const passed = data.reussi !== undefined ? data.reussi : score >= seuil;

        setResults({
          score,
          total,
          correct,
          seuil,
          passed,
          message: data.message,
          corrections: data.corrections || [],
        });
        setSubmitted(true);
      } else {
        // حساب محلي في حال كان الـ API يعيد هيكلاً مختلفاً
        let correctCount = 0;
        const total = quiz.questions.length;
        const corrections = quiz.questions.map((q) => {
          const userAns = selectedAnswers[q.id];
          const isCorrect = userAns === q.reponse;
          if (isCorrect) correctCount += 1;
          return {
            questionId: q.id,
            userAns,
            correctAns: q.reponse,
            isCorrect,
          };
        });

        const scorePct = Math.round((correctCount / total) * 100);
        const passed = scorePct >= seuil;

        setResults({
          score: scorePct,
          total,
          correct: correctCount,
          seuil,
          passed,
          corrections,
        });
        setSubmitted(true);
      }
    } catch (e: any) {
      console.error('Quiz submit error:', e);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل النتيجة، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="جاري إعداد ورقة أسئلة الاختبار..." />;
  }

  if (error || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>⚠️</ThemedText>
        <ThemedText style={styles.errorTitle}>{error || 'لا توجد أسئلة متوفرة لهذا الاختبار.'}</ThemedText>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <ThemedText style={styles.retryBtnTxt}>العودة للدرس</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const isSummative = quiz.type === 'SOMMATIF';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: quiz.titre || quiz.title || (isSummative ? 'الاختبار الختامي الشامل' : 'الاختبار التكويني'),
          headerBackTitle: 'الرجوع',
          headerTitleAlign: 'center',
          headerTintColor: '#059669',
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
        {submitted && results ? (
          /* ── شاشة النتيجة والتصحيح ── */
          <View style={styles.resultCard}>
            <View style={[styles.scoreCircle, { backgroundColor: results.passed ? '#059669' : '#DC2626' }]}>
              <ThemedText style={styles.scoreNumber}>{results.score}%</ThemedText>
            </View>

            <ThemedText style={[styles.resultTitle, { color: results.passed ? '#059669' : '#DC2626' }]}>
              {results.passed
                ? (isSummative ? '🏆 مبارك عليك ! اجتزت الاختبار النهائي بنجاح باهر' : '✅ أحسنت ! اجتزت اختبار الفصل بنجاح')
                : '❌ لم توفق في هذه المحاولة'}
            </ThemedText>

            <ThemedText style={styles.resultScoreDetail}>
              الإجابات الصحيحة: {results.correct} من {results.total} أسئلة
            </ThemedText>

            {!results.passed && (
              <ThemedText style={styles.resultAdviceText}>
                {results.message ||
                  `تحصلت على علامة ${results.score}%. يجب تحقيق نسبة ${results.seuil}% على الأقل لفتح الفصل التالي أو استحقاق الشهادة.`}
              </ThemedText>
            )}

            <View style={styles.resultActions}>
              <Pressable
                style={[styles.resultBtn, { backgroundColor: '#059669' }]}
                onPress={() => router.back()}
              >
                <ThemedText style={styles.resultBtnTxt}>
                  {results.passed ? 'متابعة الدورة التعليمية ←' : 'العودة لمراجعة محتوى الدرس'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.resultBtn, styles.correctionBtn]}
                onPress={() => setShowCorrections(!showCorrections)}
              >
                <ThemedText style={[styles.resultBtnTxt, { color: '#374151' }]}>
                  {showCorrections ? 'إخفاء ورقة التصحيح' : 'مراجعة الإجابات والتصحيح البيداغوجي 📋'}
                </ThemedText>
              </Pressable>
            </View>

            {/* تفاصيل التصحيح البيداغوجي */}
            {showCorrections ? (
              <View style={styles.correctionsList}>
                <ThemedText style={styles.correctionsHeader}>ورقة التصحيح التفصيلية :</ThemedText>
                {quiz.questions.map((q, idx) => {
                  const userAns = selectedAnswers[q.id];
                  const isCorrect = userAns === q.reponse;
                  return (
                    <View
                      key={q.id}
                      style={[
                        styles.correctionItem,
                        {
                          borderColor: isCorrect ? '#A7F3D0' : '#FECACA',
                          backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
                        },
                      ]}
                    >
                      <ThemedText style={styles.correctionQTitle}>
                        السؤال {idx + 1}: {q.texte}
                      </ThemedText>
                      <ThemedText style={styles.correctionAns}>
                        إجابتك: {userAns ? `« ${userAns} »` : 'لم تجب'} {isCorrect ? '✅' : '❌'}
                      </ThemedText>
                      {!isCorrect && q.reponse ? (
                        <ThemedText style={styles.correctionRightAns}>
                          الإجابة الصحيحة: « {q.reponse} »
                        </ThemedText>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : (
          /* ── شاشة ورقة الأسئلة والتفاعل ── */
          <>
            {/* شريط المؤقت والتقدم */}
            <View style={styles.metaRow}>
              {timeLeft !== null && (
                <View style={styles.timerBadge}>
                  <ThemedText style={styles.timerText}>⏳ {formatTime(timeLeft)}</ThemedText>
                </View>
              )}
              <ThemedText style={styles.progressText}>
                السؤال {currentQuestion + 1} من {quiz.questions.length}
              </ThemedText>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* بطاقة السؤال */}
            <View style={styles.questionCard}>
              <ThemedText style={styles.questionText}>{currentQ.texte}</ThemedText>

              {/* خيارات الإجابة */}
              <View style={styles.optionsList}>
                {(currentQ.choix || []).map((choix, cIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === choix;
                  return (
                    <Pressable
                      key={cIdx}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => handleSelectOption(currentQ.id, choix)}
                    >
                      <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {choix}
                      </ThemedText>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* أزرار التنقل بين الأسئلة */}
            <View style={styles.navRow}>
              {currentQuestion > 0 ? (
                <Pressable
                  style={styles.navBtn}
                  onPress={() => setCurrentQuestion((prev) => prev - 1)}
                >
                  <ThemedText style={styles.navBtnTxt}>السابق ←</ThemedText>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {isLastQuestion ? (
                <Pressable
                  style={[styles.navBtn, styles.submitBtn, submitting && { opacity: 0.7 }]}
                  disabled={submitting}
                  onPress={handleSubmitQuiz}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText style={styles.submitBtnTxt}>تأكيد وإرسال الإجابات ✓</ThemedText>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.navBtn, styles.nextBtn]}
                  onPress={() => setCurrentQuestion((prev) => prev + 1)}
                >
                  <ThemedText style={styles.nextBtnTxt}>→ السؤال التالي</ThemedText>
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
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'right',
  },
  progressBar: {
    width: '100%',
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
  },
  optionCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#065F46',
    fontWeight: '800',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  navRow: {
    flexDirection: 'row-reverse',
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
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  submitBtn: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  resultScoreDetail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 12,
  },
  resultAdviceText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  resultActions: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  resultBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  correctionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  resultBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  correctionsList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  correctionsHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 12,
  },
  correctionItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'flex-end',
  },
  correctionQTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  correctionAns: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'right',
  },
  correctionRightAns: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    textAlign: 'right',
    marginTop: 2,
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