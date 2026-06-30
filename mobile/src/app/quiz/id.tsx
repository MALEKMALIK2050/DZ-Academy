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
import { BottomTabInset, Spacing } from '@/constants/theme';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  accent: '#208AEF',
  danger: '#DC2626',
  success: '#22C55E',
  lightGray: '#F3F4F6',
};

interface Answer {
  id: string | number;
  texte: string;
  correct?: boolean;
}

interface Question {
  id: string | number;
  texte: string;
  reponses: Answer[];
  explanation?: string;
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
      const endpoint = API_ENDPOINTS.quiz;
      const response = await fetch(`${endpoint}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setQuiz(data.quiz || data);
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

  const handleSelectAnswer = (answerId: string | number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerId,
    });
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
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
      'Êtes-vous sûr? Vous ne pourrez pas modifier vos réponses après.',
      [
        { text: 'Annuler' },
        {
          text: 'Soumettre',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await fetch(`${API_ENDPOINTS.quiz}/${id}/submit`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
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
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={fetchQuiz}>
            <ThemedText style={styles.retryButtonText}>Réessayer</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!quiz) return null;

  // Afficher les résultats
  if (submitted && results) {
    const score = results.score || 0;
    const passed = score >= (quiz.passingScore || 70);

    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
            },
          ]}
        >
          <ThemedView style={styles.resultsContainer}>
            <ThemedView
              style={[
                styles.scoreCircle,
                { backgroundColor: passed ? Colors.success : Colors.danger },
              ]}
            >
              <ThemedText style={styles.scoreText}>{score}%</ThemedText>
            </ThemedView>

            <ThemedText type="title" style={styles.resultTitle}>
              {passed ? '✅ Réussi!' : '❌ Non réussi'}
            </ThemedText>

            <ThemedText type="small" style={styles.resultMessage}>
              {passed
                ? `Félicitations! Vous avez obtenu ${score}% au quiz.`
                : `Score: ${score}%. Vous devez obtenir au moins ${quiz.passingScore || 70}%.`}
            </ThemedText>

            {/* Détails des réponses */}
            <ThemedView style={styles.answersReview}>
              <ThemedText type="subtitle">Récapitulatif</ThemedText>
              {quiz.questions.map((q, index) => {
                const userAnswer = selectedAnswers[index];
                const correctAnswer = q.reponses.find(r => r.correct);
                const isCorrect = userAnswer === correctAnswer?.id;

                return (
                  <ThemedView
                    key={q.id}
                    style={[
                      styles.reviewItem,
                      {
                        borderLeftColor: isCorrect ? Colors.success : Colors.danger,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={[
                        styles.reviewQuestion,
                        { color: isCorrect ? Colors.success : Colors.danger },
                      ]}
                    >
                      {isCorrect ? '✓' : '✗'} Question {index + 1}: {q.texte}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </ThemedView>

            <Pressable
              style={({ pressed }) => [
                styles.finishButton,
                pressed && styles.finishButtonPressed,
              ]}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.finishButtonText}>Retourner</ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  // Afficher le quiz
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}
      >
        {/* En-tête */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">{quiz.titre}</ThemedText>
          <ThemedView style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                },
              ]}
            />
          </ThemedView>
          <ThemedText type="small" style={styles.progressText}>
            Question {currentQuestion + 1} sur {quiz.questions.length}
          </ThemedText>
        </ThemedView>

        {/* Question */}
        <ThemedView style={styles.questionContainer}>
          <ThemedText type="subtitle" style={styles.questionText}>
            {question?.texte}
          </ThemedText>

          {/* Réponses */}
          <ThemedView style={styles.answersContainer}>
            {question?.reponses.map((answer) => {
              const isSelected = selectedAnswers[currentQuestion] === answer.id;

              return (
                <Pressable
                  key={answer.id}
                  onPress={() => handleSelectAnswer(answer.id)}
                  style={({ pressed }) => [
                    styles.answerButton,
                    isSelected && styles.answerButtonSelected,
                    pressed && styles.answerButtonPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.answerCheckbox,
                      isSelected && styles.answerCheckboxSelected,
                    ]}
                  >
                    {isSelected && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                  </View>
                  <ThemedText
                    type="small"
                    style={[isSelected && styles.answerTextSelected]}
                  >
                    {answer.texte}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </ThemedView>

        {/* Boutons de navigation */}
        <ThemedView style={styles.navigationContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.navButton,
              currentQuestion === 0 && styles.navButtonDisabled,
              pressed && styles.navButtonPressed,
            ]}
            onPress={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ThemedText
              style={[
                styles.navButtonText,
                currentQuestion === 0 && styles.navButtonTextDisabled,
              ]}
            >
              ← Précédent
            </ThemedText>
          </Pressable>

          {currentQuestion === quiz.questions.length - 1 ? (
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Soumettre</ThemedText>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.navButtonPressed,
              ]}
              onPress={handleNext}
            >
              <ThemedText style={styles.navButtonText}>Suivant →</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    padding: Spacing.four,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '500',
    marginBottom: Spacing.three,
  },
  retryButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    marginBottom: Spacing.five,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginVertical: Spacing.three,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    opacity: 0.7,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.four,
    marginBottom: Spacing.five,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionText: {
    marginBottom: Spacing.four,
    fontWeight: '600',
  },
  answersContainer: {
    gap: Spacing.three,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  answerButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightGray,
  },
  answerButtonPressed: {
    opacity: 0.7,
  },
  answerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: 'white',
    fontWeight: '700',
  },
  answerTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.six,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonPressed: {
    backgroundColor: Colors.lightGray,
  },
  navButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: Colors.primary,
    opacity: 0.5,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  resultsContainer: {
    alignItems: 'center',
    marginVertical: Spacing.six,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
  },
  resultTitle: {
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  resultMessage: {
    textAlign: 'center',
    marginBottom: Spacing.five,
    opacity: 0.7,
  },
  answersReview: {
    width: '100%',
    marginVertical: Spacing.five,
  },
  reviewItem: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.two,
  },
  reviewQuestion: {
    fontWeight: '500',
  },
  finishButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: 8,
  },
  finishButtonPressed: {
    opacity: 0.85,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});