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
  const { id: courseId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchPretest();
  }, [courseId]);

  const fetchPretest = async () => {
    try {
      // Le endpoint pretest sur Vercel n'accepte pas toujours les headers correctement.
      // On fetch donc le cours entier qui contient le pretest.
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

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      Alert.alert('Attention', 'Veuillez répondre à toutes les questions.');
      return;
    }

    Alert.alert(
      'Soumettre le prétest',
      'Êtes-vous sûr ?',
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
              if (!response.ok) throw new Error(data.error || 'Erreur réseau');
              
              setResult(data.data || data);
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
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
            {isGood ? '✅ Bon niveau !' : '⚠️ Prétest terminé'}
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
            onPress={() => router.replace(`/course/${courseId}`)}
          >
            <ThemedText style={styles.buttonText}>🚀 Accéder au chapitre 1</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // ═══ ECRAN DU QUIZ ═══
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
          <ThemedText style={styles.title}>Prétest du cours</ThemedText>
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

        {questions.map((q, index) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberBadge}>
                <ThemedText style={styles.questionNumberText}>{index + 1}</ThemedText>
              </View>
              <ThemedText style={styles.questionText}>{q.texte}</ThemedText>
            </View>
            
            <View style={styles.optionsContainer}>
              {q.choix?.map((option, i) => {
                const isSelected = answers[q.id] === option;
                return (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                      pressed && !isSelected && { backgroundColor: C.gray50 }
                    ]}
                    onPress={() => handleSelect(q.id, option)}
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
        ))}

        <Pressable 
          style={({ pressed }) => [
            styles.submitButton,
            answeredCount < totalQuestions && styles.submitButtonDisabled,
            pressed && answeredCount === totalQuestions && { opacity: 0.85 }
          ]}
          onPress={handleSubmit}
          disabled={submitting || answeredCount < totalQuestions}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              {answeredCount < totalQuestions 
                ? `Il reste ${totalQuestions - answeredCount} question(s)` 
                : 'Soumettre mes réponses'}
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gray50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.gray50 },
  scrollContent: { padding: 16 },

  // Header
  header: { marginBottom: 24 },
  headerBadge: { 
    backgroundColor: C.primaryLight, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12 
  },
  headerBadgeText: { color: C.primaryDark, fontWeight: '800', fontSize: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.gray900, marginBottom: 8 },
  subtitle: { color: C.gray600, fontSize: 14, lineHeight: 20, marginBottom: 20 },

  // Progress Bar
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, fontWeight: '700', color: C.gray700 },
  progressValues: { fontSize: 13, fontWeight: '700', color: C.primary },
  progressBarBg: { height: 8, backgroundColor: C.gray200, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },

  // Question Card
  questionCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.gray200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  questionNumberBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginTop: 2
  },
  questionNumberText: { color: C.primaryDark, fontWeight: '800', fontSize: 14 },
  questionText: { fontSize: 16, fontWeight: '700', color: C.gray800, flex: 1, lineHeight: 24 },
  
  // Options
  optionsContainer: { gap: 8 },
  optionButton: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 2, borderColor: C.gray200, borderRadius: 12,
  },
  optionButtonSelected: {
    borderColor: C.primary, backgroundColor: C.primaryLight,
  },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.gray300,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioCircleSelected: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  optionText: { color: C.gray700, fontSize: 15, flex: 1 },
  optionTextSelected: { color: C.primaryDark, fontWeight: '700' },

  // Submit Button
  submitButton: {
    backgroundColor: C.primary, padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: C.gray300 },
  submitButtonText: { color: 'white', fontWeight: '800', fontSize: 16 },

  // Result Screen
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scoreCircle: {
    width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  scoreText: { fontSize: 44, fontWeight: '800', color: 'white' },
  resultTitle: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  resultFeedback: {
    fontSize: 15, color: C.gray600, textAlign: 'center', lineHeight: 22, marginBottom: 24
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 32,
    borderWidth: 1, borderColor: '#BFDBFE'
  },
  infoBoxIcon: { fontSize: 24 },
  infoBoxText: { flex: 1, color: '#1E3A8A', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 14, width: '100%', alignItems: 'center'
  },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
