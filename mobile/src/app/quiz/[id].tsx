import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS } from '@/constants/api';

const C = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  secondary: '#F97316',
  secondaryLight: '#FFF7ED',
  accent: '#208AEF',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#EAB308',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

interface Question {
  id: string | number;
  texte: string;
  choix: string[];
  reponse?: string;
}

interface QuizDetail {
  id: string | number;
  titre: string;
  description: string;
  questions: Question[];
  passingScore?: number;
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fetchQuiz = async () => {
    try {
      setError(null);
      const endpoint = API_ENDPOINTS.quizGet(id as string);
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const data = await response.json();
      setQuiz(data.quiz || data);

      if (data.dejaReussi) {
        setResults({
          score: data.bestScore,
          seuil: data.seuilReussite,
          reussi: true,
          message: "Vous avez déjà réussi ce quiz.",
          nextChapterId: data.nextChapterId,
          nextChapterTitle: data.nextChapterTitle,
          nextChapterNumber: data.nextChapterNumber
        });
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Fetch quiz error:', err);
      setError('Erreur lors du chargement du quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id, token]);

  const question = quiz?.questions[currentQuestion];
  const totalQuestions = quiz?.questions?.length || 0;

  const handleSelectAnswer = (answer: string) => {
    if (question) {
      setSelectedAnswers({
        ...selectedAnswers,
        [question.id]: answer,
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    Alert.alert(
      'Soumettre le quiz',
      'Êtes-vous sûr ? Vous ne pourrez pas modifier vos réponses après.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await fetch(API_ENDPOINTS.quizSubmit, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  quizId: id,
                  answers: selectedAnswers,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                setResults(data.results || data);
                setSubmitted(true);
              } else {
                Alert.alert('Erreur', 'Erreur lors de la soumission');
              }
            } catch (err) {
              console.error('Submit error:', err);
              Alert.alert('Erreur', 'Erreur réseau');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <ThemedText style={styles.loadingText}>Chargement du quiz...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText style={styles.errorTxt}>{error}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={fetchQuiz}>
            <ThemedText style={styles.retryTxt}>Réessayer</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (!quiz) return null;

  // ═══ ECRAN DE RESULTAT ═══
  if (submitted && results) {
    const score = results.score || 0;
    const seuil = results.seuil || 75;
    const passed = results.reussi !== undefined ? results.reussi : score >= seuil;

    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          
          <View style={styles.resultHeaderCard}>
            <View style={[styles.scoreCircle, { backgroundColor: passed ? C.success : C.danger }]}>
              <ThemedText style={styles.scoreText}>{score}%</ThemedText>
            </View>
            <ThemedText style={[styles.resultTitle, { color: passed ? C.success : C.danger }]}>
              {passed ? '✅ Quiz Réussi !' : '❌ Non réussi'}
            </ThemedText>
            {!passed && (
              <ThemedText style={styles.resultMessage}>
                {results.message || `Vous avez obtenu ${score}%. Il faut au moins ${seuil}% pour valider ce quiz.`}
              </ThemedText>
            )}
          </View>

          {passed && (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: C.success,
              marginVertical: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}>
              <ThemedText style={{ fontSize: 34, fontWeight: '900', color: C.primaryDark, textAlign: 'center' }}>
                Bravo !
              </ThemedText>
              <ThemedText style={{ fontSize: 24, marginVertical: 6, textAlign: 'center' }}>
                🌸
              </ThemedText>
              <ThemedText style={{ color: C.gray700, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                {results.message || "Vous avez validé ce quiz formatif avec succès !"}
              </ThemedText>
            </View>
          )}

          {Object.keys(selectedAnswers).length > 0 && (
            <View style={styles.reviewSection}>
              <ThemedText style={styles.reviewTitle}>Récapitulatif des réponses</ThemedText>
              
              {quiz.questions.map((q, index) => {
                const userAnswer = selectedAnswers[q.id];
                const correctAnswer = q.reponse;
                const isCorrect = String(userAnswer || "").trim().toLowerCase() === String(correctAnswer || "").trim().toLowerCase();

                return (
                  <View key={q.id} style={[styles.reviewCard, { borderLeftColor: isCorrect ? C.success : C.danger }]}>
                    <View style={styles.reviewCardHeader}>
                      <View style={[styles.reviewBadge, { backgroundColor: isCorrect ? C.successLight : C.dangerLight }]}>
                        <ThemedText style={{ fontSize: 16 }}>{isCorrect ? '✓' : '✗'}</ThemedText>
                      </View>
                      <ThemedText style={styles.reviewQuestionText}>Question {index + 1}</ThemedText>
                    </View>
                    <ThemedText style={styles.reviewQuestionBody}>{q.texte}</ThemedText>
                    
                    <View style={styles.reviewAnswerBox}>
                      <ThemedText style={styles.reviewAnswerLabel}>Votre réponse :</ThemedText>
                      <ThemedText style={[styles.reviewAnswerValue, { color: isCorrect ? C.success : C.danger }]}>
                        {userAnswer || 'Aucune réponse'}
                      </ThemedText>
                    </View>
                    
                    {!isCorrect && correctAnswer && (
                      <View style={[styles.reviewAnswerBox, { backgroundColor: C.successLight, marginTop: 8 }]}>
                        <ThemedText style={[styles.reviewAnswerLabel, { color: C.primaryDark }]}>Bonne réponse :</ThemedText>
                        <ThemedText style={[styles.reviewAnswerValue, { color: C.primaryDark }]}>{correctAnswer}</ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ flexDirection: 'column', gap: 12 }}>
            {passed && results.nextChapterId ? (
              <Pressable 
                style={({ pressed }) => [
                  {
                    backgroundColor: C.secondary, // Orange
                    borderColor: C.primaryDark, // Green border
                    borderWidth: 2,
                    borderRadius: 14,
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
                ]}
                onPress={() => router.replace({ pathname: '/chapter/[id]', params: { id: results.nextChapterId } })}
              >
                <ThemedText style={{ color: 'white', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Accéder au Chapitre Suivant :
                </ThemedText>
                <ThemedText style={{ color: 'white', fontSize: 15, fontWeight: '800', marginTop: 4, textAlign: 'center' }}>
                  "{results.nextChapterTitle}" →
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable 
                style={({ pressed }) => [
                  styles.finishButton, 
                  (!passed || results.isReset) && { backgroundColor: C.danger },
                  pressed && { opacity: 0.85 }
                ]}
                onPress={() => {
                  const targetCourseId = quiz?.courseId || quiz?.chapter?.courseId;
                  if (targetCourseId) {
                    router.navigate({ pathname: '/course/[id]', params: { id: targetCourseId } });
                  } else {
                    router.back();
                  }
                }}
              >
                <ThemedText style={styles.finishButtonText}>
                  {results.isReset ? 'Recommencer le chapitre' : 'Retour au cours'}
                </ThemedText>
              </Pressable>
            )}
          </View>

        </ScrollView>
      </ThemedView>
    );
  }

  // ═══ ECRAN DE QUIZ (PAGINE) ═══
  const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <ThemedText style={styles.headerBadgeText}>📝 Test Formatif</ThemedText>
          </View>
          <ThemedText style={styles.title}>{quiz.titre}</ThemedText>
          {quiz.description ? (
            <ThemedText style={styles.subtitle}>{quiz.description}</ThemedText>
          ) : null}

          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressText}>Question {currentQuestion + 1}</ThemedText>
            <ThemedText style={styles.progressValues}>sur {totalQuestions}</ThemedText>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Question Card */}
        {question && (
          <View style={styles.questionCard}>
            <ThemedText style={styles.questionBodyText}>{question.texte}</ThemedText>

            <View style={styles.optionsContainer}>
              {question.choix?.map((answer, i) => {
                const isSelected = selectedAnswers[question.id] === answer;
                return (
                  <Pressable
                    key={i}
                    onPress={() => handleSelectAnswer(answer)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                      pressed && !isSelected && { backgroundColor: C.gray50 }
                    ]}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {answer}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Boutons de navigation */}
        <View style={styles.navRow}>
          <Pressable
            style={({ pressed }) => [
              styles.navBtn,
              currentQuestion === 0 && styles.navBtnDisabled,
              pressed && currentQuestion > 0 && { backgroundColor: C.gray200 }
            ]}
            onPress={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ThemedText style={[styles.navBtnText, currentQuestion === 0 && { color: C.gray400 }]}>
              ← Précédent
            </ThemedText>
          </Pressable>

          {currentQuestion === totalQuestions - 1 ? (
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                submitting && { opacity: 0.6 }
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.submitBtnText}>Soumettre ✓</ThemedText>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                styles.navBtnNext,
                pressed && { opacity: 0.85 }
              ]}
              onPress={handleNext}
            >
              <ThemedText style={[styles.navBtnText, { color: C.primaryDark }]}>Suivant →</ThemedText>
            </Pressable>
          )}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gray50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.gray50 },
  scrollContent: { padding: 16 },
  loadingText: { marginTop: 12, color: C.gray500, fontSize: 14 },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2', borderRadius: 16, padding: 24,
    alignItems: 'center', marginTop: 40, borderWidth: 1, borderColor: '#FECACA',
  },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorTxt: { color: C.danger, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: C.danger, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: 'white', fontWeight: '700' },

  // Header
  header: { marginBottom: 24 },
  headerBadge: { 
    backgroundColor: C.primaryLight, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12 
  },
  headerBadgeText: { color: C.primaryDark, fontWeight: '800', fontSize: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.gray900, marginBottom: 8 },
  subtitle: { color: C.gray600, fontSize: 14, lineHeight: 20, marginBottom: 20 },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, fontWeight: '700', color: C.gray700 },
  progressValues: { fontSize: 13, fontWeight: '700', color: C.primary },
  progressBarBg: { height: 8, backgroundColor: C.gray200, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },

  // Question Card
  questionCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: C.gray200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  questionBodyText: { fontSize: 17, fontWeight: '700', color: C.gray900, lineHeight: 26, marginBottom: 20 },
  
  optionsContainer: { gap: 10 },
  optionButton: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 2, borderColor: C.gray200, borderRadius: 12,
  },
  optionButtonSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.gray300,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioCircleSelected: { borderColor: C.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary },
  optionText: { color: C.gray700, fontSize: 15, flex: 1 },
  optionTextSelected: { color: C.primaryDark, fontWeight: '700' },

  // Navigation Buttons
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.gray300,
    alignItems: 'center', backgroundColor: 'white',
  },
  navBtnDisabled: { backgroundColor: C.gray100, borderColor: C.gray200 },
  navBtnNext: { borderColor: C.primaryLight, backgroundColor: C.primaryLight },
  navBtnText: { fontWeight: '700', color: C.gray700, fontSize: 15 },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },

  // Result Header
  resultHeaderCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: C.gray200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  scoreText: { fontSize: 36, fontWeight: '800', color: 'white' },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  resultMessage: { fontSize: 14, color: C.gray600, textAlign: 'center', lineHeight: 20 },

  // Reviews
  reviewSection: { marginBottom: 24 },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: C.gray900, marginBottom: 16 },
  reviewCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.gray200, borderLeftWidth: 4,
  },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reviewQuestionText: { fontSize: 14, fontWeight: '700', color: C.gray800 },
  reviewQuestionBody: { fontSize: 15, color: C.gray900, marginBottom: 12, lineHeight: 22 },
  reviewAnswerBox: {
    backgroundColor: C.gray50, padding: 12, borderRadius: 8,
  },
  reviewAnswerLabel: { fontSize: 12, color: C.gray500, fontWeight: '600', marginBottom: 4 },
  reviewAnswerValue: { fontSize: 14, fontWeight: '700' },

  finishButton: {
    backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  finishButtonText: { color: 'white', fontWeight: '800', fontSize: 16 },
});