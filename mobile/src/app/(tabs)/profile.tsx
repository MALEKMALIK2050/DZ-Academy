import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  danger: '#DC2626',
  accent: '#208AEF',
  lightGray: '#F3F4F6',
  darkGray: '#6B7280',
  dark: '#1F2937',
  mediumGray: '#4B5563',
  lightText: '#374151',
};

// ── Modal d'information réutilisable ──
function InfoModal({ visible, title, content, onClose }: {
  visible: boolean; title: string; content: string; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{title}</Text>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Text style={modalStyles.closeTxt}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={modalStyles.body} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={modalStyles.content}>{content}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const CGU_TEXT = `CONDITIONS GÉNÉRALES D'UTILISATION

Article 1 - Champ d'application
Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme CB ACADEMY, accessible à l'adresse cb-academy-dz.vercel.app.

Article 2 - Acceptation des conditions
L'inscription sur la plateforme implique l'acceptation pleine et entière des présentes CGU. L'utilisateur déclare avoir pris connaissance des conditions générales d'utilisation, de vente et de la politique de protection des données à caractère personnel et les accepte sans réserve.

Article 3 - Protection des données personnelles
Conformément à la loi algérienne n°18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel :
• Les données collectées sont strictement nécessaires à la gestion des inscriptions, du suivi pédagogique et des communications.
• L'utilisateur dispose d'un droit d'accès, de rectification et d'opposition sur ses données.
• Les données sont conservées pour une durée maximale de 5 ans après la dernière activité.
• Des mesures de sécurité sont mises en œuvre pour protéger les données.

Article 4 - Propriété intellectuelle
Les contenus mis à disposition sur la plateforme (cours, exercices, vidéos) sont protégés par le droit d'auteur. Toute reproduction ou diffusion est interdite sans autorisation.

Article 5 - Charte des étudiants et parents
L'étudiant et ses parents s'engagent à :
• Utiliser leurs identifiants de manière personnelle et confidentielle.
• Adopter un comportement respectueux dans les espaces d'échange.
• Ne pas tenter de contourner les mesures de sécurité.

Article 6 - Droit applicable
Les présentes CGU sont régies par le droit algérien. Tout litige relève de la compétence des tribunaux d'Alger.`;

const PREREQ_TEXT = `PRÉREQUIS TECHNIQUES

Pour suivre les formations sur la plateforme CB ACADEMY, l'utilisateur doit disposer des équipements et logiciels suivants :

1. Connexion Internet
• Connexion internet stable avec un débit minimum recommandé de 2 Mbps en réception et 1 Mbps en émission.
• Pour les sessions en visioconférence : débit recommandé de 5 Mbps.

2. Navigateur Web récent
• Google Chrome : version 80 ou supérieure
• Mozilla Firefox : version 75 ou supérieure
• Microsoft Edge : version 80 ou supérieure
• Safari : version 13 ou supérieure

3. Logiciels requis
• Lecteur PDF : Adobe Acrobat Reader ou équivalent (gratuit)
• Lecteur vidéo : VLC Media Player ou équivalent

4. Adresse email
• Une adresse email valide est obligatoire pour recevoir les communications de la plateforme.

5. Matériel pour visioconférence (si applicable)
• Microphone : fonctionnel pour participer aux échanges audio.
• Webcam : recommandée pour les sessions interactives.

⚠️ Important : L'utilisateur reconnaît que l'insuffisance de ses équipements techniques ne pourra en aucun cas engager la responsabilité de CB ACADEMY.`;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [showCgu, setShowCgu] = useState(false);
  const [showPrereq, setShowPrereq] = useState(false);

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

  const handleContactSupport = () => {
    Alert.alert(
      '📞 Contacter le support',
      'Cheikh Bouamama Academy\n\n📧 Email : contact@cb-academy-dz.com\n🌐 Site web : cb-academy-dz.vercel.app\n\nNous répondons sous 24-48h.',
      [
        { text: 'Fermer', style: 'cancel' },
        {
          text: '📧 Envoyer un email',
          onPress: () => Linking.openURL('mailto:contact@cb-academy-dz.com'),
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'ℹ️ À propos',
      'CBA Academy — Application Mobile\nVersion 1.0.0\n\nCheikh Bouamama Academy\nPlateforme d\'apprentissage en ligne\n\n© 2024 — Tous droits réservés',
      [
        { text: 'Fermer', style: 'cancel' },
        {
          text: '🌐 Visiter le site',
          onPress: () => Linking.openURL('https://cb-academy-dz.vercel.app'),
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Mon Profil</Text>
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
                <Text style={styles.avatarInitials}>
                  {(user?.prenom?.[0] || 'E').toUpperCase()}
                </Text>
              </ThemedView>
            )}
          </ThemedView>

          {/* Infos personnelles */}
          <Text style={styles.userName}>
            {user?.prenom} {user?.nom}
          </Text>

          <Text style={styles.userEmail}>
            {user?.email}
          </Text>

          {user?.niveau ? (
            <ThemedView style={styles.levelBadge}>
              <Text style={styles.levelText}>
                📚 {user.niveau}
              </Text>
            </ThemedView>
          ) : null}

          {user?.role ? (
            <Text style={styles.roleText}>
              Rôle : {user.role}
            </Text>
          ) : null}
        </ThemedView>

        {/* Sections informatives */}
        <ThemedView style={styles.section}>
          <Text style={styles.sectionTitle}>
            À propos
          </Text>

          <ThemedView style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              👤 Nom complet
            </Text>
            <Text style={styles.infoValue}>
              {user?.prenom} {user?.nom}
            </Text>
          </ThemedView>

          <ThemedView style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              📧 Email
            </Text>
            <Text style={styles.infoValue}>
              {user?.email}
            </Text>
          </ThemedView>

          {user?.niveau ? (
            <ThemedView style={styles.infoItem}>
              <Text style={styles.infoLabel}>
                📚 Niveau
              </Text>
              <Text style={styles.infoValue}>
                {user.niveau}
              </Text>
            </ThemedView>
          ) : null}
        </ThemedView>

        {/* Informations pratiques */}
        <ThemedView style={styles.section}>
          <Text style={styles.sectionTitle}>
            Informations pratiques
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
            onPress={handleContactSupport}
          >
            <Text style={styles.settingText}>📞 Contacter le support</Text>
            <Text style={styles.arrowText}>→</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
            onPress={() => setShowCgu(true)}
          >
            <Text style={styles.settingText}>📋 Conditions d'utilisation</Text>
            <Text style={styles.arrowText}>→</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
            onPress={() => setShowPrereq(true)}
          >
            <Text style={styles.settingText}>💻 Prérequis techniques</Text>
            <Text style={styles.arrowText}>→</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
            onPress={handleAbout}
          >
            <Text style={styles.settingText}>ℹ️ À propos de l'application</Text>
            <Text style={styles.arrowText}>→</Text>
          </Pressable>
        </ThemedView>

        {/* Modals */}
        <InfoModal
          visible={showCgu}
          title="📋 Conditions d'utilisation"
          content={CGU_TEXT}
          onClose={() => setShowCgu(false)}
        />
        <InfoModal
          visible={showPrereq}
          title="💻 Prérequis techniques"
          content={PREREQ_TEXT}
          onClose={() => setShowPrereq(false)}
        />

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
            <Text style={styles.logoutButtonText}>
              🚪 Se déconnecter
            </Text>
          )}
        </Pressable>

        {/* Footer */}
        <ThemedView style={styles.footer}>
          <Text style={styles.footerText}>
            Cheikh Bouamama Academy v1.0.0
          </Text>
          <Text style={styles.footerText}>
            © 2024 - Tous droits réservés
          </Text>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontWeight: '700', fontSize: 16, color: Colors.dark },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 18, color: Colors.darkGray },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  content: { fontSize: 14, lineHeight: 22, color: Colors.lightText },
});

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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.five,
    alignItems: 'center',
    marginBottom: Spacing.six,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    textAlign: 'center',
    marginBottom: Spacing.two,
    color: Colors.mediumGray,
    fontSize: 14,
  },
  levelBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  levelText: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 13,
  },
  roleText: {
    marginTop: Spacing.two,
    color: Colors.mediumGray,
    textAlign: 'center',
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing.six,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: Spacing.three,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
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
    color: Colors.dark,
    fontSize: 13,
  },
  infoValue: {
    color: Colors.mediumGray,
    fontSize: 13,
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
  settingText: {
    color: Colors.lightText,
    fontSize: 14,
    fontWeight: '500',
  },
  arrowText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
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
    color: Colors.mediumGray,
    fontSize: 12,
    marginBottom: Spacing.one,
    fontWeight: '500',
  },
});
