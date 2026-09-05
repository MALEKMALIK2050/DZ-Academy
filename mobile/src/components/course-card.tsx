// src/components/course-card.tsx
import React from 'react';
import { StyleSheet, Pressable, View, I18nManager } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  getMatiereStyles,
  getSubjectIcon,
  getMatiereLabel,
  getClasseLabel,
  getNiveauLabel,
} from '@/constants/algerian-education';

interface CourseCardProps {
  id: string | number;
  titre?: string;
  title?: string;
  description?: string;
  progress?: number;
  chaptersCount?: number;
  rating?: number;
  enseignant?: string;
  teachers?: { id?: number; nom?: string; prenom?: string }[];
  niveau?: string;
  annee?: string;
  matiere?: string;
  etudiants?: number;
  onPress?: (courseId: string | number) => void;
  style?: any;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  titre,
  title,
  description,
  progress,
  chaptersCount,
  rating,
  enseignant,
  teachers,
  niveau,
  annee,
  matiere,
  onPress,
  style,
}) => {
  const displayTitle = titre || title || 'دورة تعليمية';
  const stylesSubject = getMatiereStyles(matiere || displayTitle);
  const icon = getSubjectIcon(matiere || displayTitle);
  const matiereLabel = getMatiereLabel(matiere);
  const niveauLabel = getNiveauLabel(niveau);
  const classeLabel = getClasseLabel(annee);

  const teacherName =
    enseignant ||
    (teachers && teachers.length > 0 ? `${teachers[0].prenom || ''} ${teachers[0].nom || ''}`.trim() : '');

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    } else {
      router.push({ pathname: '/course/[id]', params: { id: String(id) } });
    }
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
      <View style={styles.cardContent}>
        {/* شريط المادة العلوي المميز */}
        <View style={[styles.banner, { backgroundColor: stylesSubject.background }]}>
          <ThemedText style={[styles.bannerSymbol, { color: stylesSubject.color }]}>
            {icon}
          </ThemedText>
          <View style={[styles.iconBadge, { backgroundColor: stylesSubject.color }]}>
            <ThemedText style={styles.badgeText}>{icon}</ThemedText>
          </View>
        </View>

        {/* جسم البطاقة */}
        <View style={styles.info}>
          {/* تصنيف المادة والمستوى */}
          <View style={styles.tagsRow}>
            {matiereLabel ? (
              <View style={[styles.tag, { backgroundColor: stylesSubject.background, borderColor: stylesSubject.border }]}>
                <ThemedText style={[styles.tagText, { color: stylesSubject.color }]}>
                  {matiereLabel}
                </ThemedText>
              </View>
            ) : null}
            {classeLabel ? (
              <View style={[styles.tag, styles.tagClasse]}>
                <ThemedText style={styles.tagClasseText}>{classeLabel}</ThemedText>
              </View>
            ) : null}
          </View>

          {/* عنوان الدورة */}
          <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
            {displayTitle}
          </ThemedText>

          {/* اسم الأستاذ */}
          {teacherName ? (
            <ThemedText type="small" style={styles.enseignant}>
              👨‍🏫 الأستاذ: {teacherName}
            </ThemedText>
          ) : null}

          {/* البيانات الإضافية */}
          <View style={styles.metadata}>
            {niveauLabel ? (
              <ThemedText type="small" style={styles.metaItem}>
                🏛️ {niveauLabel}
              </ThemedText>
            ) : null}
            {chaptersCount !== undefined ? (
              <ThemedText type="small" style={styles.metaItem}>
                📖 {chaptersCount} فصول
              </ThemedText>
            ) : null}
            {rating ? (
              <ThemedText type="small" style={styles.metaItem}>
                ⭐ {rating}
              </ThemedText>
            ) : null}
          </View>

          {/* شريط تقدم الطالب */}
          {progress !== undefined && (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <ThemedText type="small" style={[styles.progressText, { color: stylesSubject.color }]}>
                  {Math.round(progress)}%
                </ThemedText>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: stylesSubject.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* زر متابعة التعلم */}
        <View style={[styles.accessBtn, { backgroundColor: stylesSubject.color }]}>
          <View style={styles.accessBtnInner}>
            <ThemedText style={styles.accessBtnText}>متابعة التعلم</ThemedText>
            <ThemedText style={styles.accessBtnArrow}>←</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAE8E4',
  },
  banner: {
    height: 85,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerSymbol: {
    position: 'absolute',
    fontSize: 70,
    opacity: 0.12,
    right: 15,
    bottom: -15,
    fontWeight: '900',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  badgeText: {
    fontSize: 22,
  },
  info: {
    padding: Spacing.three,
    gap: 6,
  },
  tagsRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagClasse: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  tagClasseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  title: {
    fontWeight: '800',
    fontSize: 17,
    color: '#1F2937',
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    lineHeight: 24,
  },
  enseignant: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  metadata: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 6,
  },
  progressRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 7,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 35,
    textAlign: 'left',
  },
  accessBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessBtnInner: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  accessBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  accessBtnArrow: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});

export default CourseCard;