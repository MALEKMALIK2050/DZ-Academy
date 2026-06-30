import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  accent: '#208AEF',
  lightGray: '#F3F4F6',
};

interface ChapterDetail {
  id: string | number;
  titre: string;
  description: string;
  contenu?: string;
  videoUrl?: string;
  ressources?: Array<{ url: string; nom: string }>;
  quiz?: { id: string | number; titre: string };
  completed?: boolean;
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChapterDetails = async () => {
    try {
      setError(null);
      const endpoint = API_ENDPOINTS.chapterDetails(id as string);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setChapter(data.chapter || data);
    } catch (err) {
      console.error('Fetch chapter details error:', err);
      setError('Erreur lors du chargement du chapitre');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChapterDetails();
  }, [id, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChapterDetails();
  };

  const handleOpenVideo = async () => {
    if (chapter?.videoUrl) {
      await Linking.openURL(chapter.videoUrl);
    }
  };

const handleQuizPress = () => {
  if (chapter?.quiz) {
    router.push({
      pathname: '/quiz/[id]' as const,
      params: { id: chapter.quiz.id },
    });
  }
};
  const handleOpenResource = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening resource:', err);
    }
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable style={styles.retryButton} onPress={fetchChapterDetails}>
              <ThemedText style={styles.retryButtonText}>Réessayer</ThemedText>
            </Pressable>
          </ThemedView>
        ) : chapter ? (
          <>
            {/* En-tête */}
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.colorBand, { backgroundColor: Colors.secondary }]} />
              <ThemedText type="title" style={styles.title}>
                {chapter.titre}
              </ThemedText>
              {chapter.completed && (
                <ThemedView style={styles.completedBadge}>
                  <ThemedText style={styles.completedText}>✓ Terminé</ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Description */}
            {chapter.description && (
              <ThemedView style={styles.section}>
                <ThemedText type="small" style={styles.content}>
                  {chapter.description}
                </ThemedText>
              </ThemedView>
            )}

            {/* Vidéo */}
            {chapter.videoUrl && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  📹 Vidéo
                </ThemedText>
                <Pressable
                  style={({ pressed }) => [
                    styles.videoButton,
                    pressed && styles.videoButtonPressed,
                  ]}
                  onPress={handleOpenVideo}
                >
                  <ThemedText style={styles.videoButtonText}>
                    ▶️ Regarder la vidéo
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}

            {/* Contenu texte */}
            {chapter.contenu && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  📝 Contenu
                </ThemedText>
                <ThemedText type="small" style={styles.content}>
                  {chapter.contenu}
                </ThemedText>
              </ThemedView>
            )}

            {/* Ressources */}
            {chapter.ressources && chapter.ressources.length > 0 && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  📎 Ressources ({chapter.ressources.length})
                </ThemedText>
                <ThemedView style={styles.resourcesList}>
                  {chapter.ressources.map((resource, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.resourceItem,
                        pressed && styles.resourceItemPressed,
                      ]}
                      onPress={() => handleOpenResource(resource.url)}
                    >
                      <ThemedText type="small">📄 {resource.nom}</ThemedText>
                      <ThemedText style={styles.arrowText}>→</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {/* Quiz */}
            {chapter.quiz && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  ✏️ Évaluation
                </ThemedText>
                <Pressable
                  style={({ pressed }) => [
                    styles.quizButton,
                    pressed && styles.quizButtonPressed,
                  ]}
                  onPress={handleQuizPress}
                >
                  <ThemedView style={styles.quizButtonContent}>
                    <ThemedText style={styles.quizButtonText}>
                      {chapter.quiz.titre || 'Démarrer le quiz'}
                    </ThemedText>
                    <ThemedText style={styles.quizArrow}>→</ThemedText>
                  </ThemedView>
                </Pressable>
              </ThemedView>
            )}
          </>
        ) : null}
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
    paddingVertical: Spacing.six,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: Spacing.four,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: Spacing.three,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.four,
    marginBottom: Spacing.five,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorBand: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.three,
  },
  title: {
    marginBottom: Spacing.two,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  completedText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
    color: Colors.primary,
  },
  content: {
    lineHeight: 22,
    opacity: 0.8,
  },
  videoButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  videoButtonPressed: {
    opacity: 0.85,
  },
  videoButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  resourcesList: {
    gap: Spacing.two,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resourceItemPressed: {
    backgroundColor: Colors.lightGray,
  },
  arrowText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  quizButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: Spacing.four,
  },
  quizButtonPressed: {
    opacity: 0.85,
  },
  quizButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  quizArrow: {
    color: 'white',
    fontSize: 18,
  },
});