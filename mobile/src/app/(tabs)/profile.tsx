import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { BottomTabInset, Spacing } from '@/constants/theme';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  danger: '#DC2626',
  lightGray: '#F3F4F6',
  darkGray: '#6B7280',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', onPress: () => {} },
      {
        text: 'Déconnecter',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace('/');
        },
        style: 'destructive',
      },
    ]);
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
      >
        {/* En-tête */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Mon Profil</ThemedText>
        </ThemedView>

        {/* Carte de profil */}
        <ThemedView style={styles.profileCard}>
          {/* Avatar placeholder */}
          <ThemedView style={styles.avatarContainer}>
            {user?.photo ? (
              <Image
                source={{ uri: user.photo }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <ThemedView style={styles.avatarPlaceholder}>
                <ThemedText style={styles.avatarInitials}>
                  {(user?.prenom?.[0] || 'E').toUpperCase()}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Infos personnelles */}
          <ThemedText type="title" style={styles.userName}>
            {user?.prenom} {user?.nom}
          </ThemedText>

          <ThemedText type="small" style={styles.userEmail}>
            {user?.email}
          </ThemedText>

          {user?.niveau && (
            <ThemedView style={styles.levelBadge}>
              <ThemedText type="small" style={styles.levelText}>
                📚 {user.niveau}
              </ThemedText>
            </ThemedView>
          )}

          {user?.role && (
            <ThemedText type="small" style={styles.roleText}>
              Rôle: {user.role}
            </ThemedText>
          )}
        </ThemedView>

        {/* Sections informatives */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            À propos
          </ThemedText>

          <ThemedView style={styles.infoItem}>
            <ThemedText type="small" style={styles.infoLabel}>
              👤 Nom complet
            </ThemedText>
            <ThemedText type="small" style={styles.infoValue}>
              {user?.prenom} {user?.nom}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.infoItem}>
            <ThemedText type="small" style={styles.infoLabel}>
              📧 Email
            </ThemedText>
            <ThemedText type="small" style={styles.infoValue}>
              {user?.email}
            </ThemedText>
          </ThemedView>

          {user?.niveau && (
            <ThemedView style={styles.infoItem}>
              <ThemedText type="small" style={styles.infoLabel}>
                📚 Niveau
              </ThemedText>
              <ThemedText type="small" style={styles.infoValue}>
                {user.niveau}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Paramètres */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Paramètres
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
          >
            <ThemedText type="small">🔔 Notifications</ThemedText>
            <ThemedText style={styles.arrowText}>→</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
          >
            <ThemedText type="small">🌙 Mode sombre</ThemedText>
            <ThemedText style={styles.arrowText}>→</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
          >
            <ThemedText type="small">🔒 Confidentialité</ThemedText>
            <ThemedText style={styles.arrowText}>→</ThemedText>
          </Pressable>
        </ThemedView>

        {/* Bouton déconnexion */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
            loggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <ThemedText style={styles.logoutButtonText}>
              🚪 Se déconnecter
            </ThemedText>
          )}
        </Pressable>

        {/* Footer */}
        <ThemedView style={styles.footer}>
          <ThemedText type="small" style={styles.footerText}>
            Cheikh Bouamama Academy v1.0.0
          </ThemedText>
          <ThemedText type="small" style={styles.footerText}>
            © 2024 - Tous droits réservés
          </ThemedText>
        </ThemedView>
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
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.five,
    alignItems: 'center',
    marginBottom: Spacing.six,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
  },
  userName: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  userEmail: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: Spacing.two,
  },
  levelBadge: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    marginTop: Spacing.two,
  },
  levelText: {
    fontWeight: '600',
  },
  roleText: {
    marginTop: Spacing.two,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.six,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: Spacing.three,
    color: Colors.primary,
  },
  infoItem: {
    backgroundColor: 'white',
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  infoValue: {
    opacity: 0.7,
  },
  settingItem: {
    backgroundColor: 'white',
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItemPressed: {
    backgroundColor: Colors.lightGray,
  },
  arrowText: {
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.5,
  },
});