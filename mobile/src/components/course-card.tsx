import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  accent: '#208AEF',
  lightGray: '#F3F4F6',
};

interface CourseCardProps {
  id: string | number;
  titre: string;
  description: string;
  progress?: number;
  chaptersCount?: number;
  rating?: number;
  enseignant?: string;
  niveau?: string;
  etudiants?: number;
  onPress?: (courseId: string | number) => void;
  style?: any;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  titre,
  description,
  progress,
  chaptersCount,
  rating,
  enseignant,
  niveau,
  etudiants,
  onPress,
  style,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(id);
    } else {
      router.push({
        pathname: '/course/[id]',
        params: { id },
      });
    }
  };

  // Déterminer la couleur basée sur l'ID
  const getColor = () => {
    if (id % 3 === 0) return Colors.primary;
    if (id % 3 === 1) return Colors.secondary;
    return Colors.accent;
  };

  const getIcon = () => {
    if (id % 3 === 0) return '🌱';
    if (id % 3 === 1) return '🔥';
    return '⚡';
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <ThemedView style={styles.cardContent}>
        {/* Bannière */}
        <ThemedView style={[styles.banner, { backgroundColor: getColor() }]}>
          <ThemedText style={styles.bannerIcon}>{getIcon()}</ThemedText>
        </ThemedView>

        {/* Infos */}
        <ThemedView style={styles.info}>
          <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
            {titre}
          </ThemedText>

          <ThemedText type="small" style={styles.description} numberOfLines={2}>
            {description}
          </ThemedText>

          {/* Métadonnées */}
          <ThemedView style={styles.metadata}>
            {niveau && (
              <ThemedText type="small" style={styles.metaItem}>
                📊 {niveau}
              </ThemedText>
            )}
            {chaptersCount && (
              <ThemedText type="small" style={styles.metaItem}>
                📖 {chaptersCount}
              </ThemedText>
            )}
            {etudiants && (
              <ThemedText type="small" style={styles.metaItem}>
                👥 {etudiants}
              </ThemedText>
            )}
          </ThemedView>

          {/* Rating */}
          {rating && (
            <ThemedView style={styles.rating}>
              <ThemedText style={styles.stars}>
                {'⭐'.repeat(Math.floor(rating))}
              </ThemedText>
              <ThemedText type="small">{rating}/5</ThemedText>
            </ThemedView>
          )}

          {/* Enseignant */}
          {enseignant && (
            <ThemedText type="small" style={styles.enseignant}>
              👨‍🏫 {enseignant}
            </ThemedText>
          )}

          {/* Progression */}
          {progress !== undefined && (
            <ThemedView style={styles.progressSection}>
              <ThemedView style={styles.progressBar}>
                <ThemedView
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: getColor(),
                    },
                  ]}
                />
              </ThemedView>
              <ThemedText type="small" style={styles.progressText}>
                {Math.round(progress)}%
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Bouton accès */}
        <ThemedView style={[styles.accessBtn, { backgroundColor: getColor() }]}>
          <ThemedText style={styles.accessBtnText}>→</ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  banner: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: {
    fontSize: 40,
  },
  info: {
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    opacity: 0.6,
    color: '#6B7280',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  metaItem: {
    fontSize: 12,
    opacity: 0.7,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  stars: {
    fontSize: 12,
  },
  enseignant: {
    opacity: 0.7,
    fontSize: 12,
  },
  progressSection: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  accessBtn: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  accessBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});