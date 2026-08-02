// src/app/(tabs)/badges.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';

const { width } = Dimensions.get('window');

const AnimatedBadge = ({
  title,
  icon,
  color,
  description,
  unlocked,
}: {
  title: string;
  icon: string;
  color: string;
  description: string;
  unlocked: boolean;
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}>
      <Animated.View
        style={[
          styles.badgeContainer,
          {
            transform: [{ rotateY: spin }],
            shadowColor: unlocked ? color : '#9CA3AF',
          },
        ]}
      >
        <View style={[styles.badgeInner, { backgroundColor: unlocked ? color : '#9CA3AF' }]}>
          <Text style={styles.badgeIcon}>{icon}</Text>
        </View>
      </Animated.View>
      <ThemedText style={styles.badgeTitle}>{title}</ThemedText>
      <ThemedText style={styles.badgeDesc}>{description}</ThemedText>
      <View style={[styles.statusPill, { backgroundColor: unlocked ? '#ECFDF5' : '#F3F4F6' }]}>
        <ThemedText style={[styles.statusPillText, { color: unlocked ? '#059669' : '#6B7280' }]}>
          {unlocked ? '✓ وسام مُكتسب' : '🔒 قيد الإنجاز'}
        </ThemedText>
      </View>
    </View>
  );
};

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();

  const BADGES = [
    {
      id: 1,
      title: 'الخطوة الأولى',
      icon: '🌱',
      color: '#10B981',
      description: 'أتممت أول درس تعليمي في منصة دزأكاديمي بنجاح.',
      unlocked: true,
    },
    {
      id: 2,
      title: 'نجم المثابرة',
      icon: '⭐',
      color: '#F59E0B',
      description: 'تسجيل الدخول ومتابعة المذاكرة لعدة أيام متتالية.',
      unlocked: true,
    },
    {
      id: 3,
      title: 'بطل الاختبارات',
      icon: '🏆',
      color: '#3B82F6',
      description: 'الحصول على علامة كاملة في اختبارات الفصول التكوينية.',
      unlocked: true,
    },
    {
      id: 4,
      title: 'المتفوق في المنهاج',
      icon: '🎖️',
      color: '#8B5CF6',
      description: 'إكمال جميع فصول دورة دراسية كاملة.',
      unlocked: false,
    },
    {
      id: 5,
      title: 'فارس البكالوريا والبيام',
      icon: '👑',
      color: '#EC4899',
      description: 'اجتياز الاختبارات الختامية الشاملة بنجاح باهر.',
      unlocked: false,
    },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>أوسمتي وإنجازاتي 🏅</ThemedText>
        <ThemedText style={styles.subtitle}>
          اجمع الأوسمة البيداغوجية وكن من المتفوقين في الجزائر عبر إتمام دروسك وحل التمارين !
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {BADGES.map((badge) => (
          <AnimatedBadge
            key={badge.id}
            title={badge.title}
            icon={badge.icon}
            color={badge.color}
            description={badge.description}
            unlocked={badge.unlocked}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    gap: 20,
  },
  badgeCard: {
    alignItems: 'center',
    width: width - 40,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  badgeCardLocked: {
    opacity: 0.8,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  badgeInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeIcon: {
    fontSize: 50,
  },
  badgeTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
