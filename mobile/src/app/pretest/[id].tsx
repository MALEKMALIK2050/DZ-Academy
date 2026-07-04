import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  secondary: '#F97316',
  secondaryLight: '#FFF7ED',
  accent: '#208AEF',
  danger: '#DC2626',
  success: '#22C55E',
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
  const [result, setResult] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchPretest();
  }, [courseId]);

  const fetchPretest = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.courseDetail(courseId as string), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Erreur réseau');
      
      if (data.pretest && data.pretest.questions) {
        setQuestions(data.pretest.questions);
      } else {
        setQuestions([]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
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
    if (Object.keys(answers).length < questions.length) {
      const missingCount = questions.length - Object.keys(answers).length;
      Alert.alert(
        'Questions non répondues',
        `Veuillez répondre aux ${missingCount} question(s) manquante(s) avant de soumettre.`
      );
      return;
    }

    Alert.alert(
      'Soumettre l\'évaluation',
      'Êtes-vous sûr de vouloir soumettre ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await fetch(API_ENDPOINTS.pretestSubmit(courseId as string), {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ reponses: answers }),
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Erreur réseau');
              }
              
              setResult(data.data || data);
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <ThemedText style={{ marginTop: 12, color: C.gray500 }}>Chargement du prétest...</ThemedText>
      </ThemedView>
    );
  }

  // ═══ ECRAN DE RESULTAT ═══
  if (result) {
    const score = result.score || 0;
    const isGood = score >= 50;

    return (
      <ThemedView style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={[styles.scoreCircle, { backgroundColor: isGood ? C.primary : C.secondary }]}>
            <ThemedText style={styles.scoreText}>{score}%</ThemedText>
          </View>
          
          <ThemedText style={[styles.resultTitle, { color: isGood ? C.primaryDark : C.secondary }]}>
            {isGood ? '✅ Bon niveau !' : '⚠️ Évaluation terminée'}
          </ThemedText>
          
          <ThemedText style={styles.resultFeedback}>
            {typeof result.feedback === 'object' 
              ? result.feedback?.message 
              : result.feedback || (isGood 
                ? "Vous avez de très bonnes bases. Vous pouvez commencer le premier chapitre en toute confiance !" 
                : "Nous vous conseillons d'être attentif lors des premiers chapitres pour bien consolider vos bases.")}
          </ThemedText>

          <View style={styles.infoBox}>
            <ThemedText style={styles.infoBoxIcon}>🔓</ThemedText>
            <ThemedText style={styles.infoBoxText}>
              Le premier chapitre est maintenant débloqué.
            </ThemedText>
          </View>
          
          <Pressable 
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            onPress={() => {
              if (courseId) {
                router.replace({
                  pathname: '/course/[id]',
                  params: { id: courseId }
                });
              }
            }}
          >
            <ThemedText style={styles.buttonText}>🚀 Accéder au chapitre 1</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // ═══ ECRAN DU QUIZ - UNE QUESTION PAR PAGE ═══
  if (questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText style={{ color: C.gray500 }}>Aucune question trouvée</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentQuestionAnswered = answers[currentQuestion.id] !== undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <ThemedText style={styles.headerBadgeText}>🎯 Évaluation</ThemedText>
          </View>
          <ThemedText style={styles.title}>Évaluation diagnostique</ThemedText>
          <ThemedText style={styles.subtitle}>
            Répondez à ces questions pour évaluer votre niveau avant de commencer.
          </ThemedText>

          {/* ProgressBar */}
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressText}>Progression</ThemedText>
            <ThemedText style={styles.progressValues}>{answeredCount} / {totalQuestions}</ThemedText>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* QUESTION ACTUELLE - UNE SEULE */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumberBadge}>
              <ThemedText style={styles.questionNumberText}>{currentQuestionIndex + 1}</ThemedText>
            </View>
            <ThemedText style={styles.questionText}>{currentQuestion.texte}</ThemedText>
          </View>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.choix?.map((option, i) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    pressed && !isSelected && { backgroundColor: C.gray50 }
                  ]}
                  onPress={() => handleSelect(currentQuestion.id, option)}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BOUTONS DE NAVIGATION */}
        <View style={styles.navigationButtons}>
          {!isFirstQuestion && (
            <Pressable 
              style={({ pressed }) => [
                styles.prevButton,
                pressed && { opacity: 0.85 }
              ]}
              onPress={handlePreviousQuestion}
            >
              <ThemedText style={styles.prevButtonText}>← Précédent</ThemedText>
            </Pressable>
          )}

          {!isLastQuestion ? (
            <Pressable 
              style={({ pressed }) => [
                styles.nextButton,
                !isCurrentQuestionAnswered && styles.nextButtonDisabled,
                pressed && isCurrentQuestionAnswered && { opacity: 0.85 }
              ]}
              onPress={handleNextQuestion}
              disabled={!isCurrentQuestionAnswered}
            >
              <ThemedText style={[styles.nextButtonText, !isCurrentQuestionAnswered && styles.nextButtonTextDisabled]}>
                Suivant →
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable 
              style={({ pressed }) => [
                styles.submitButton,
                answeredCount < totalQuestions && styles.submitButtonDisabled,
                pressed && answeredCount === totalQuestions && { opacity: 0.85 }
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Soumettre l'évaluation</ThemedText>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  headerBadgeText: {
    color: C.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: C.gray500,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.gray500,
  },
  progressValues: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: C.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: C.primary,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  questionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  questionNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  questionNumberText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: C.gray900,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    backgroundColor: 'white',
  },
  optionButtonSelected: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
    borderWidth: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: C.gray700,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: C.primary,
    fontWeight: '700',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  prevButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  prevButtonText: {
    color: C.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: C.gray300,
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  nextButtonTextDisabled: {
    color: C.gray500,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: C.gray300,
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  resultContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '900',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  resultFeedback: {
    fontSize: 14,
    color: C.gray700,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoBoxIcon: {
    fontSize: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: C.primaryDark,
    fontWeight: '600',
    lineHeight: 20,
  },
});
 