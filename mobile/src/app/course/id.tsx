import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
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
  lightGray: '#F3F4F6',
};

interface Chapter {
  id: string | number;
  titre: string;
  description?: string;
  ordre?: number;
}

interface CourseDetail {
  id: string | number;
  titre: string;
  description: string;
  chapitres?: Chapter[];
  progress?: number;
  createdAt?: string;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseDetails = async () => {
    try {
      setError(null);
      const endpoint = API_ENDPOINTS.courseDetails(id as string);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setCourse(data.course || data);
    } catch (err) {
      console.error('Fetch course details error:', err);
      setError('Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourseDetails();
  };

  const handleChapterPress = (chapterId: string | number) => {
    router.push({
      pathname: '/chapter/[id]',
      params: { id: chapterId },
    });
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
            <Pressable
              style={styles.retryButton}
              onPress={fetchCourseDetails}
            >
              <ThemedText style={styles.retryButtonText}>Réessayer</ThemedText>
            </Pressable>
          </ThemedView>
        ) : course ? (
          <>
            {/* En-tête du cours */}
            <ThemedView style={styles.courseHeader}>
              <ThemedView style={[styles.colorBand, { backgroundColor: Colors.primary }]} />
              <ThemedText type="title" style={styles.courseTitle}>
                {course.titre}
              </ThemedText>
              <ThemedText type="small" style={styles.courseDescription}>
                {course.description}
              </ThemedText>

              {/* Progression */}
              {course.progress !== undefined && (
                <ThemedView style={styles.progressSection}>
                  <ThemedView style={styles.progressHeader}>
                    <ThemedText type="small" style={styles.progressLabel}>
                      Votre progression
                    </ThemedText>
                    <ThemedText type="small" style={styles.progressPercent}>
                      {Math.round(course.progress)}%
                    </ThemedText>
                  </ThemedView>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(course.progress, 100)}%`,
                      },
                    ]}
                  />
                </ThemedView>
              )}
            </ThemedView>

            {/* Chapitres */}
            <ThemedView style={styles.chaptersSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                📚 Chapitres ({course.chapitres?.length || 0})
              </ThemedText>

              {course.chapitres && course.chapitres.length > 0 ? (
                <ThemedView style={styles.chaptersList}>
                  {course.chapitres.map((chapter, index) => (
                    <Pressable
                      key={chapter.id}
                      onPress={() => handleChapterPress(chapter.id)}
                      style={({ pressed }) => [
                        styles.chapterCard,
                        pressed && styles.chapterCardPressed,
                      ]}
                    >
                      <ThemedView style={styles.chapterNumber}>
                        <ThemedText style={styles.chapterNumberText}>
                          {chapter.ordre || index + 1}
                        </ThemedText>
                      </ThemedView>

                      <ThemedView style={styles.chapterInfo}>
                        <ThemedText type="subtitle" style={styles.chapterTitle}>
                          {chapter.titre}
                        </ThemedText>
                        {chapter.description && (
                          <ThemedText
                            type="small"
                            style={styles.chapterDescription}
                            numberOfLines={1}
                          >
                            {chapter.description}
                          </ThemedText>
                        )}
                      </ThemedView>

                      <ThemedText style={styles.chapterArrow}>→</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              ) : (
                <ThemedView style={styles.emptyChapters}>
                  <ThemedText type="small">Aucun chapitre disponible</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
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
  courseHeader: {
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
  courseTitle: {
    marginBottom: Spacing.two,
  },
  courseDescription: {
    opacity: 0.7,
    marginBottom: Spacing.three,
  },
  progressSection: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  progressLabel: {
    fontWeight: '600',
  },
  progressPercent: {
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  chaptersSection: {
    marginBottom: Spacing.six,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
    color: Colors.primary,
  },
  chaptersList: {
    gap: Spacing.three,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chapterCardPressed: {
    backgroundColor: '#F3F4F6',
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  chapterNumberText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  chapterDescription: {
    opacity: 0.6,
  },
  chapterArrow: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyChapters: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
});