import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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

interface Course {
  id: string | number;
  titre: string;
  description: string;
  progress?: number;
  chaptersCount?: number;
  createdAt?: string;
}

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.courses, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setCourses(data.courses || data || []);
    } catch (err) {
      console.error('Fetch courses error:', err);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleCoursePress = (courseId: string | number) => {
    router.push({
      pathname: '/course/[id]',
      params: { id: courseId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* En-tête */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Mes Cours</ThemedText>
          <ThemedText type="small" style={styles.greeting}>
            Bienvenue, {user?.prenom || 'Étudiant'}! 👋
          </ThemedText>
        </ThemedView>

        {/* Erreur */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}

        {/* Chargement */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText type="small" style={styles.loadingText}>
              Chargement des cours...
            </ThemedText>
          </View>
        ) : courses.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText type="subtitle" style={styles.emptyText}>
              📚 Aucun cours disponible
            </ThemedText>
            <ThemedText type="small" style={styles.emptySubtext}>
              Consultez le catalogue pour vous inscrire à des cours
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.coursesGrid}>
            {courses.map((course) => (
              <Pressable
                key={course.id}
                onPress={() => handleCoursePress(course.id)}
                style={({ pressed }) => [
                  styles.courseCard,
                  pressed && styles.courseCardPressed,
                ]}
              >
                <ThemedView style={styles.courseCardContent}>
                  {/* Couleur aléatoire par cours */}
                  <ThemedView
                    style={[
                      styles.courseColorBand,
                      {
                        backgroundColor:
                          course.id % 3 === 0
                            ? Colors.primary
                            : course.id % 3 === 1
                              ? Colors.secondary
                              : Colors.accent,
                      },
                    ]}
                  />

                  <ThemedView style={styles.courseInfo}>
                    <ThemedText
                      type="subtitle"
                      style={styles.courseTitle}
                      numberOfLines={2}
                    >
                      {course.titre}
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={styles.courseDescription}
                      numberOfLines={2}
                    >
                      {course.description}
                    </ThemedText>

                    {/* Progression */}
                    {course.progress !== undefined && (
                      <ThemedView style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${Math.min(course.progress || 0, 100)}%`,
                            },
                          ]}
                        />
                      </ThemedView>
                    )}

                    {course.progress !== undefined && (
                      <ThemedText type="small" style={styles.progressText}>
                        {Math.round(course.progress || 0)}% complété
                      </ThemedText>
                    )}

                    {course.chaptersCount && (
                      <ThemedText type="small" style={styles.chaptersCount}>
                        📖 {course.chaptersCount} chapitre(s)
                      </ThemedText>
                    )}
                  </ThemedView>

                  <ThemedView style={styles.courseArrow}>
                    <ThemedText style={styles.arrowText}>→</ThemedText>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        )}
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
  },
  header: {
    marginBottom: Spacing.six,
    backgroundColor: 'transparent',
  },
  greeting: {
    marginTop: Spacing.two,
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.four,
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  loadingText: {
    marginTop: Spacing.two,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginBottom: Spacing.two,
  },
  emptySubtext: {
    opacity: 0.6,
  },
  coursesGrid: {
    gap: Spacing.four,
    backgroundColor: 'transparent',
  },
  courseCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  courseCardPressed: {
    opacity: 0.8,
  },
  courseCardContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseColorBand: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  courseInfo: {
    flex: 1,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  courseTitle: {
    fontWeight: '600',
  },
  courseDescription: {
    opacity: 0.6,
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  chaptersCount: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
  courseArrow: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});