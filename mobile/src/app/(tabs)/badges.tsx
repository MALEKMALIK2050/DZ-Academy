import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const AnimatedBadge = ({ title, icon, color, description }: { title: string; icon: string; color: string; description: string }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 5000,
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
    <View style={styles.badgeCard}>
      <Animated.View style={[styles.badgeContainer, { transform: [{ rotateY: spin }], shadowColor: color }]}>
        <View style={[styles.badgeInner, { backgroundColor: color }]}>
          <Text style={styles.badgeIcon}>{icon}</Text>
        </View>
      </Animated.View>
      <Text style={styles.badgeTitle}>{title}</Text>
      <Text style={styles.badgeDesc}>{description}</Text>
    </View>
  );
};

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  
  const MOCK_BADGES = [
    { id: 1, title: 'Premier Pas', icon: '🌱', color: '#10B981', description: 'Vous avez complété votre premier cours.' },
    { id: 2, title: 'Étoile Montante', icon: '⭐', color: '#F59E0B', description: '5 jours consécutifs de connexion.' },
    { id: 3, title: 'Expert', icon: '🏆', color: '#3B82F6', description: 'Plus de 10 quiz réussis avec un score parfait.' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Badges 🏅</Text>
        <Text style={styles.subtitle}>Collectionnez-les tous en complétant des cours et des défis !</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {MOCK_BADGES.map((badge) => (
          <AnimatedBadge 
            key={badge.id}
            title={badge.title}
            icon={badge.icon}
            color={badge.color}
            description={badge.description}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    gap: 30,
  },
  badgeCard: {
    alignItems: 'center',
    width: width - 40,
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  badgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  badgeInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeIcon: {
    fontSize: 60,
  },
  badgeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});
