import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
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
  darkGray: '#6B7280',
};

interface Course {
  id: string | number;
  titre: string;
  description: string;
  niveau?: string;
  enseignant?: string;
  etudiants?: number;
  rating?: number;
  chaptersCount?: number;
}

export default function CatalogueScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      setError('Erreur lors du chargement du catalogue');
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

  // Filtrer par recherche
  const filteredCourses = courses.filter(course =>
    course.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <ThemedText type="title">Catalogue</ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            Explorez nos {courses.length} cours disponibles
          </ThemedText>
        </ThemedView>

        {/* Barre de recherche */}
        <ThemedView style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un cours..."
            placeholderTextColor={Colors.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        </ThemedView>

        {/* Filtres */}
        <ThemedView style={styles.filtersContainer}>
          <Pressable style={styles.filterChip}>
            <ThemedText type="small" style={styles.filterText}>
              Tous
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.filterChip, styles.filterChipSecondary]}>
            <ThemedText type="small" style={styles.filterTextSecondary}>
              Populaire
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.filterChip, styles.filterChipSecondary]}>
            <ThemedText type="small" style={styles.filterTextSecondary}>
              Nouveau
            </ThemedText>
          </Pressable>
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
              Chargement du catalogue...
            </ThemedText>
          </View>
        ) : filteredCourses.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText type="subtitle" style={styles.emptyText}>
              {searchQuery ? '🔎 Aucun cours trouvé' : '📚 Aucun cours disponible'}
            </ThemedText>
            {searchQuery && (
              <ThemedText type="small" style={styles.emptySubtext}>
                Essayez une autre recherche
              </ThemedText>
            )}
          </ThemedView>
        ) : (
          <ThemedView style={styles.coursesList}>
            {filteredCourses.map((course) => (
              <Pressable
                key={course.id}
                onPress={() => handleCoursePress(course.id)}
                style={({ pressed }) => [
                  styles.courseCard,
                  pressed && styles.courseCardPressed,
                ]}
              >
                <ThemedView style={styles.courseCardContent}>
                  {/* Bannière de couleur */}
                  <ThemedView
                    style={[
                      styles.courseBanner,
                      {
                        backgroundColor:
                          course.id % 3 === 0
                            ? Colors.primary
                            : course.id % 3 === 1
                              ? Colors.secondary
                              : Colors.accent,
                      },
                    ]}
                  >
                    <ThemedText style={styles.bannerIcon}>
                      {course.id % 3 === 0 ? '🌱' : course.id % 3 === 1 ? '🔥' : '⚡'}
                    </ThemedText>
                  </ThemedView>

                  {/* Infos du cours */}
                  <ThemedView style={styles.courseInfo}>
                    <ThemedText type="subtitle" style={styles.courseTitle} numberOfLines={2}>
                      {course.titre}
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={styles.courseDescription}
                      numberOfLines={2}
                    >
                      {course.description}
                    </ThemedText>

                    {/* Métadonnées */}
                    <ThemedView style={styles.metadata}>
                      {course.niveau && (
                        <ThemedText type="small" style={styles.metadataItem}>
                          📊 {course.niveau}
                        </ThemedText>
                      )}

                      {course.chaptersCount && (
                        <ThemedText type="small" style={styles.metadataItem}>
                          📖 {course.chaptersCount} chapitres
                        </ThemedText>
                      )}

                      {course.etudiants && (
                        <ThemedText type="small" style={styles.metadataItem}>
                          👥 {course.etudiants} étudiants
                        </ThemedText>
                      )}
                    </ThemedView>

                    {/* Rating */}
                    {course.rating && (
                      <ThemedView style={styles.ratingContainer}>
                        <ThemedText style={styles.stars}>
                          {'⭐'.repeat(Math.floor(course.rating))}
                        </ThemedText>
                        <ThemedText type="small" style={styles.ratingText}>
                          {course.rating}/5
                        </ThemedText>
                      </ThemedView>
                    )}

                    {course.enseignant && (
                      <ThemedText type="small" style={styles.enseignant}>
                        👨‍🏫 {course.enseignant}
                      </ThemedText>
                    )}
                  </ThemedView>

                  {/* Bouton d'accès */}
                  <ThemedView style={styles.accessButton}>
                    <ThemedText style={styles.accessButtonText}>→</ThemedText>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        )}

        {/* Statistiques */}
        {!loading && courses.length > 0 && (
          <ThemedView style={styles.statsContainer}>
            <ThemedText type="small" style={styles.statsText}>
              ✅ Affichage {filteredCourses.length} sur {courses.length} cours
            </ThemedText>
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
    marginBottom: Spacing.four,
    backgroundColor: 'transparent',
  },
  subtitle: {
    marginTop: Spacing.one,
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
    fontFamily: 'System',
    color: '#1F2937',
  },
  searchIcon: {
    fontSize: 18,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
    backgroundColor: 'transparent',
  },
  filterChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
  },
  filterChipSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterText: {
    color: 'white',
    fontWeight: '600',
  },
  filterTextSecondary: {
    color: Colors.darkGray,
    fontWeight: '600',
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
  coursesList: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
    backgroundColor: 'transparent',
  },
  courseCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  courseCardPressed: {
    opacity: 0.85,
  },
  courseCardContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseBanner: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: {
    fontSize: 48,
  },
  courseInfo: {
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  courseTitle: {
    fontWeight: '600',
  },
  courseDescription: {
    opacity: 0.6,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginVertical: Spacing.one,
    backgroundColor: 'transparent',
  },
  metadataItem: {
    opacity: 0.7,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  stars: {
    fontSize: 12,
  },
  ratingText: {
    fontWeight: '600',
    color: Colors.secondary,
  },
  enseignant: {
    opacity: 0.7,
    marginTop: Spacing.one,
  },
  accessButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  accessButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  statsContainer: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statsText: {
    opacity: 0.6,
  },
});