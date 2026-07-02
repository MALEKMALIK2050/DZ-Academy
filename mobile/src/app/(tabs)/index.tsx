import React, { useState, useEffect, useCallback } from 'react';
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

const C = {
  green: '#16A34A',
  orange: '#F97316',
  blue: '#2563EB',
  amber: '#D97706',
  red: '#DC2626',
  gray: '#6B7280',
  light: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

interface Enrollment {
  id: number;
  statut: 'EN_ATTENTE' | 'PAYE' | 'GRATUIT' | 'REJETE';
  progression: number;
  completed: boolean;
  typePaiement: string;
  course: {
    id: number;
    title: string;
    description?: string;
    matiere?: string;
    niveau?: string;
    annee?: string;
    chapters: { id: number }[];
    teachers: { id: number; nom: string; prenom: string }[];
  };
  cooldownLocked?: boolean;
  lockedUntil?: string;
}

export default function MesCoursScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API_ENDPOINTS.studentCourses, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      // L'API retourne { catalogue, enrollments }
      setEnrollments(Array.isArray(data.enrollments) ? data.enrollments : []);
    } catch (err) {
      console.error('fetchEnrollments error:', err);
      setError('Impossible de charger vos cours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const onRefresh = () => { setRefreshing(true); fetchEnrollments(); };

  const actifs = enrollments.filter(e => e.statut === 'PAYE' || e.statut === 'GRATUIT');
  const attente = enrollments.filter(e => e.statut === 'EN_ATTENTE');

  const bandColor = (index: number) =>
    [C.green, C.blue, C.orange, '#7C3AED', '#0891B2'][index % 5];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Mes Cours 📚</ThemedText>
          <ThemedText type="small" style={styles.sub}>
            Bienvenue, {user?.prenom || 'Étudiant'} !
          </ThemedText>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.green }]}>
            <ThemedText style={styles.statNum}>{actifs.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Cours actifs</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.amber }]}>
            <ThemedText style={styles.statNum}>{attente.length}</ThemedText>
            <ThemedText style={styles.statLabel}>En attente</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.blue }]}>
            <ThemedText style={styles.statNum}>
              {actifs.filter(e => e.completed).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Terminés</ThemedText>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.green} />
            <ThemedText type="small" style={{ marginTop: 12 }}>Chargement...</ThemedText>
          </View>
        ) : (
          <>
            {/* Cours actifs */}
            {actifs.length > 0 ? (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  ✅ Mes cours actifs
                </ThemedText>
                {actifs.map((e, i) => (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      if (e.cooldownLocked && e.lockedUntil) {
                        import('react-native').then(({ Alert }) => {
                          const date = new Date(e.lockedUntil!).toLocaleDateString('fr-FR');
                          Alert.alert(
                            "Cours verrouillé 🔒",
                            `Veuillez patienter 5 jours après la fin de votre cours précédent de ${e.course.matiere}.\n\nCe cours sera disponible le ${date}.`
                          );
                        });
                        return;
                      }
                      router.push({ pathname: '/course/[id]', params: { id: e.course.id } });
                    }}
                    style={({ pressed }) => [styles.card, pressed ? { opacity: 0.85 } : null, e.cooldownLocked && { opacity: 0.7 }]}
                  >
                    <View style={[styles.band, { backgroundColor: bandColor(i) }]} />
                    <View style={styles.cardBody}>
                      <ThemedText type="subtitle" style={styles.cardTitle} numberOfLines={2}>
                        {e.course.title}
                      </ThemedText>
                      <View style={styles.tags}>
                        {e.course.matiere ? <View style={styles.tag}><ThemedText style={styles.tagText}>{e.course.matiere}</ThemedText></View> : null}
                        {e.course.annee ? <View style={[styles.tag, { backgroundColor: '#EFF6FF' }]}><ThemedText style={[styles.tagText, { color: C.blue }]}>{e.course.annee}</ThemedText></View> : null}
                        {e.statut === 'GRATUIT' ? <View style={[styles.tag, { backgroundColor: '#F0FDF4' }]}><ThemedText style={[styles.tagText, { color: C.green }]}>Gratuit</ThemedText></View> : null}
                      </View>
                      {e.course.teachers?.[0] ? (
                        <ThemedText type="small" style={styles.teacher}>
                          👨‍🏫 {e.course.teachers[0].prenom} {e.course.teachers[0].nom}
                        </ThemedText>
                      ) : null}
                      {/* Barre de progression */}
                      <View style={styles.progressRow}>
                        <View style={styles.progressBg}>
                          <View style={[styles.progressFill, {
                            width: `${Math.min(e.progression || 0, 100)}%` as any,
                            backgroundColor: e.completed ? C.green : C.blue,
                          }]} />
                        </View>
                        <ThemedText type="small" style={styles.progressTxt}>
                          {e.progression || 0}%
                        </ThemedText>
                      </View>
                      {e.completed ? (
                        <ThemedText type="small" style={{ color: C.green, marginTop: 2 }}>
                          🏆 Cours terminé !
                        </ThemedText>
                      ) : null}
                      <View style={styles.chapInfo}>
                        <ThemedText type="small" style={styles.grayTxt}>
                          📖 {e.course.chapters?.length || 0} chapitre{(e.course.chapters?.length || 0) !== 1 ? 's' : ''}
                        </ThemedText>
                        <View style={[styles.btn, { backgroundColor: e.cooldownLocked ? '#9CA3AF' : (e.progression || 0) > 0 ? C.blue : C.green }]}>
                          <ThemedText style={styles.btnTxt}>
                            {e.cooldownLocked ? '🔒 Verrouillé' : (e.progression || 0) > 0 ? 'Continuer →' : 'Commencer →'}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}

            {/* En attente */}
            {attente.length > 0 ? (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  ⏳ Demandes en attente
                </ThemedText>
                {attente.map(e => (
                  <View key={e.id} style={[styles.card, styles.pendingCard]}>
                    <View style={[styles.band, { backgroundColor: C.amber }]} />
                    <View style={styles.cardBody}>
                      <ThemedText type="subtitle" style={styles.cardTitle} numberOfLines={2}>
                        {e.course.title}
                      </ThemedText>
                      <View style={styles.tags}>
                        {e.course.matiere ? <View style={styles.tag}><ThemedText style={styles.tagText}>{e.course.matiere}</ThemedText></View> : null}
                        <View style={[styles.tag, { backgroundColor: '#FFFBEB' }]}>
                          <ThemedText style={[styles.tagText, { color: C.amber }]}>
                            {e.typePaiement === 'PARCOURS_COMPLET' ? 'Parcours complet' : 'Cours seul'}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText type="small" style={styles.grayTxt}>
                        ⏳ En attente de validation par l'admin
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {/* Vide */}
            {actifs.length === 0 && attente.length === 0 ? (
              <View style={styles.empty}>
                <ThemedText style={{ fontSize: 56 }}>📭</ThemedText>
                <ThemedText type="subtitle" style={{ marginTop: 16, textAlign: 'center' }}>
                  Aucun cours inscrit
                </ThemedText>
                <ThemedText type="small" style={[styles.grayTxt, { textAlign: 'center', marginTop: 8 }]}>
                  Explorez le catalogue pour demander l'accès à des cours
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/(tabs)/explore')}
                  style={[styles.btn, { backgroundColor: C.green, marginTop: 20, paddingHorizontal: 24 }]}
                >
                  <ThemedText style={styles.btnTxt}>🔍 Parcourir le catalogue</ThemedText>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.four },
  header: { marginBottom: Spacing.four },
  sub: { opacity: 0.6, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.five },
  statCard: { flex: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 2, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: C.red, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: C.red },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  sectionTitle: { marginBottom: Spacing.three, marginTop: Spacing.two },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingCard: { borderColor: '#FDE68A', borderWidth: 1.5 },
  band: { width: 5 },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  cardTitle: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, color: C.green, fontWeight: '600' },
  teacher: { opacity: 0.6, color: '#4B5563' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBg: { flex: 1, height: 7, backgroundColor: C.light, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressTxt: { fontSize: 12, fontWeight: '600', minWidth: 34, color: '#4B5563' },
  chapInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  grayTxt: { color: C.gray },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
});