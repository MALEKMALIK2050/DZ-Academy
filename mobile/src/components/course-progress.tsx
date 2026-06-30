import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface CourseProgressProps {
  progress: number;
  color?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const CourseProgress: React.FC<CourseProgressProps> = ({
  progress,
  color = '#16A34A',
  showLabel = true,
  size = 'medium',
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const styles = getStyles(size);

  return (
    <ThemedView style={styles.container}>
      {showLabel && (
        <ThemedView style={styles.labelContainer}>
          <ThemedText type="small" style={styles.label}>
            Progression
          </ThemedText>
          <ThemedText style={styles.percent}>{Math.round(normalizedProgress)}%</ThemedText>
        </ThemedView>
      )}

      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${normalizedProgress}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Texte descriptif */}
      {normalizedProgress < 100 ? (
        <ThemedText type="small" style={styles.helper}>
          À bientôt complété! 💪
        </ThemedText>
      ) : (
        <ThemedText type="small" style={styles.helper}>
          ✅ Complété!
        </ThemedText>
      )}
    </ThemedView>
  );
};

function getStyles(size: 'small' | 'medium' | 'large') {
  const barHeights = {
    small: 4,
    medium: 8,
    large: 12,
  };

  return StyleSheet.create({
    container: {
      gap: Spacing.two,
      backgroundColor: 'transparent',
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontWeight: '600',
      color: '#1F2937',
    },
    percent: {
      fontWeight: '700',
      color: '#16A34A',
      fontSize: 14,
    },
    barBackground: {
      height: barHeights[size],
      backgroundColor: '#F3F4F6',
      borderRadius: barHeights[size] / 2,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: barHeights[size] / 2,
    },
    helper: {
      opacity: 0.7,
      fontSize: 12,
    },
  });
}