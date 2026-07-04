import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  secondary: '#F97316',
  secondaryLight: '#FFF7ED',
  accent: '#208AEF',
  accentLight: '#EFF6FF',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

type SupportType = 'VIDEO' | 'PDF' | 'PPT' | 'IMAGE' | 'SCORM' | 'ARTICULATE' | 'TEXTE' | 'FORUM';

interface Support {
  id: number;
  type: SupportType;
  nom?: string;
  url?: string;
  contenu?: string;
  ordre: number;
}

interface QuizInfo {
  id: number;
  type: string;
  questions?: any[];
}

interface ChapterDetail {
  id: number;
  title?: string;
  titre?: string;
  content?: string;
  objectifs?: string;
  supports: Support[];
  quiz?: QuizInfo;
}

const SUPPORT_CONFIG: Record<SupportType, { icon: string; label: string; color: string; bg: string }> = {
  VIDEO: { icon: '🎬', label: 'Vidéo', color: '#DC2626', bg: '#FEF2F2' },
  PDF: { icon: '📄', label: 'PDF', color: '#2563EB', bg: '#EFF6FF' },
  PPT: { icon: '📊', label: 'Présentation', color: '#D97706', bg: '#FFFBEB' },
  IMAGE: { icon: '🖼️', label: 'Image', color: '#059669', bg: '#ECFDF5' },
  SCORM: { icon: '📦', label: 'Module SCORM', color: '#7C3AED', bg: '#F5F3FF' },
  ARTICULATE: { icon: '🎯', label: 'Module Articulate', color: '#0891B2', bg: '#ECFEFF' },
  TEXTE: { icon: '📝', label: 'Texte', color: '#16A34A', bg: '#F0FDF4' },
  FORUM: { icon: '💬', label: 'Forum', color: '#2563EB', bg: '#EFF6FF' },
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface VideoModalProps {
  visible: boolean;
  videoUrl: string;
  videoName?: string;
  onClose: () => void;
}

function VideoModal({ visible, videoUrl, videoName, onClose }: VideoModalProps) {
  const insets = useSafeAreaInsets();

  const openInBrowser = async () => {
    try {
      await WebBrowser.openBrowserAsync(videoUrl);
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'ouvrir la vidéo");
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <ThemedText style={styles.closeBtnTxt}>✕</ThemedText>
          </Pressable>
          <ThemedText style={styles.modalTitle} numberOfLines={1}>
            {videoName || 'Vidéo'}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.videoPlayerContainer}>
          <View style={styles.videoInfo}>
            <ThemedText style={styles.videoIcon}>▶️</ThemedText>
            <ThemedText style={styles.videoTitle}>{videoName || 'Vidéo'}</ThemedText>
            <Pressable style={styles.watchBtn} onPress={openInBrowser}>
              <ThemedText style={styles.watchBtnText}>▶ Regarder sur YouTube</ThemedText>
            </Pressable>
            <Pressable style={[styles.watchBtn, styles.closeVideoBtn]} onPress={onClose}>
              <ThemedText style={styles.closeVideoBtnText}>✕ Fermer</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: number; url: string; nom?: string } | null>(null);
  
  const [expandedTextId, setExpandedTextId] = useState<number | null>(null);

  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  const fetchChapter = async () => {
    try {
      setError(null);
      const res = await fetch(API_ENDPOINTS.chapterDetails(id as string), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setChapter(data);

      if (data.quiz && data.quiz.id) {
        try {
          const quizRes = await fetch(API_ENDPOINTS.quizGet(data.quiz.id), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (quizRes.ok) {
            const quizData = await quizRes.json();
            setQuizScore(quizData.bestScore);
            setQuizCompleted(quizData.dejaReussi || false);
          }
        } catch (quizErr) {
          console.log("Erreur chargement quiz score:", quizErr);
        }
      } else {
        setQuizScore(null);
        setQuizCompleted(false);
      }
    } catch (err: any) {
      setError('Erreur lors du chargement du chapitre');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChapter();
  }, [id, token]);

  const handleOpenURL = async (url?: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir ce lien.");
    }
  };

  const handleVideoPress = (support: Support) => {
    setSelectedVideo({
      id: support.id,
      url: support.url || '',
      nom: support.nom,
    });
    setVideoModalVisible(true);
  };

  const handleQuizPress = () => {
    if (chapter?.quiz) {
      router.push({ pathname: '/quiz/[id]', params: { id: chapter.quiz.id } });
    }
  };

  const toggleTextSupport = (id: number) => {
    setExpandedTextId(expandedTextId === id ? null : id);
  };

  const renderHTMLContent = (htmlContent: string) => {
    if (!htmlContent) return null;

    let cleanHtml = htmlContent
      .replace(/&divide;/g, '÷')
      .replace(/&times;/g, '×')
      .replace(/&minus;/g, '−')
      .replace(/&plusmn;/g, '±')
      .replace(/&radic;/g, '√')
      .replace(/&pi;/g, 'π')
      .replace(/&alpha;/g, 'α')
      .replace(/&beta;/g, 'β')
      .replace(/&gamma;/g, 'γ')
      .replace(/&delta;/g, 'δ')
      .replace(/&epsilon;/g, 'ε')
      .replace(/&theta;/g, 'θ')
      .replace(/&lambda;/g, 'λ')
      .replace(/&mu;/g, 'μ')
      .replace(/&sigma;/g, 'σ')
      .replace(/&omega;/g, 'ω')
      .replace(/⁰/g, '⁰')
      .replace(/¹/g, '¹')
      .replace(/²/g, '²')
      .replace(/³/g, '³')
      .replace(/⁴/g, '⁴')
      .replace(/⁵/g, '⁵')
      .replace(/⁶/g, '⁶')
      .replace(/⁷/g, '⁷')
      .replace(/⁸/g, '⁸')
      .replace(/⁹/g, '⁹')
      .replace(/₀/g, '₀')
      .replace(/₁/g, '₁')
      .replace(/₂/g, '₂')
      .replace(/₃/g, '₃')
      .replace(/₄/g, '₄')
      .replace(/₅/g, '₅')
      .replace(/₆/g, '₆')
      .replace(/₇/g, '₇')
      .replace(/₈/g, '₈')
      .replace(/₉/g, '₉');

    return (
      <RenderHTML
        contentWidth={width - 32}
        source={{ html: cleanHtml }}
        tagsStyles={{
          p: { fontSize: 15, lineHeight: 26, color: C.gray700, marginBottom: 10 },
          strong: { fontWeight: '700', color: C.gray900 },
          b: { fontWeight: '700', color: C.gray900 },
          sup: { fontSize: 11, lineHeight: 16, color: C.gray700, top: -4 },
          sub: { fontSize: 11, lineHeight: 16, color: C.gray700, bottom: -4 },
          h1: { fontSize: 24, fontWeight: 'bold', color: C.gray900, marginTop: 16, marginBottom: 10 },
          h2: { fontSize: 20, fontWeight: 'bold', color: C.gray900, marginTop: 14, marginBottom: 8 },
          h3: { fontSize: 17, fontWeight: 'bold', color: C.gray800, marginTop: 12, marginBottom: 6 },
          ul: { marginBottom: 10, paddingLeft: 20 },
          ol: { marginBottom: 10, paddingLeft: 20 },
          li: { fontSize: 15, lineHeight: 26, color: C.gray700, marginBottom: 4 },
          a: { color: C.accent, textDecorationLine: 'underline' },
          blockquote: { 
            backgroundColor: C.gray50, 
            padding: 12, 
            borderRadius: 8, 
            borderLeftWidth: 4, 
            borderLeftColor: C.accent,
            marginVertical: 8,
          },
          table: { borderWidth: 1, borderColor: C.gray200, marginVertical: 10 },
          td: { borderWidth: 1, borderColor: C.gray200, padding: 8 },
          th: { borderWidth: 1, borderColor: C.gray200, padding: 8, fontWeight: 'bold', backgroundColor: C.gray50 },
        }}
      />
    );
  };

  const chapterTitle = chapter?.titre || chapter?.title || 'Chapitre';
  const videos = chapter?.supports?.filter(s => s.type === 'VIDEO') ?? [];
  const textSupports = chapter?.supports?.filter(s => s.type === 'TEXTE') ?? [];
  const resourceSupports = chapter?.supports?.filter(s => 
    s.type === 'PDF' || s.type === 'PPT' || s.type === 'IMAGE'
  ) ?? [];
  const otherSupports = chapter?.supports?.filter(s => 
    s.type !== 'VIDEO' && s.type !== 'TEXTE' && 
    s.type !== 'PDF' && s.type !== 'PPT' && s.type !== 'IMAGE'
  ) ?? [];

  const getResourceIcon = (type: string): string => {
    switch(type) {
      case 'PDF': return '📄';
      case 'PPT': return '📊';
      case 'IMAGE': return '🖼️';
      default: return '📎';
    }
  };

  const getResourceLabel = (type: string): string => {
    switch(type) {
      case 'PDF': return 'PDF';
      case 'PPT': return 'Présentation';
      case 'IMAGE': return 'Image';
      default: return 'Fichier';
    }
  };

  const getResourceColor = (type: string): string => {
    switch(type) {
      case 'PDF': return '#2563EB';
      case 'PPT': return '#D97706';
      case 'IMAGE': return '#059669';
      default: return '#6B7280';
    }
  };

  const getResourceBg = (type: string): string => {
    switch(type) {
      case 'PDF': return '#EFF6FF';
      case 'PPT': return '#FFFBEB';
      case 'IMAGE': return '#ECFDF5';
      default: return '#F3F4F6';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChapter(); }} />}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorTxt}>{error}</ThemedText>
            <Pressable style={styles.retryBtn} onPress={fetchChapter}>
              <ThemedText style={styles.retryTxt}>Réessayer</ThemedText>
            </Pressable>
          </View>
        ) : chapter ? (
          <>
            {/* En-tête du chapitre */}
            <View style={styles.header}>
              <ThemedText style={styles.title}>{chapterTitle}</ThemedText>
              {chapter.objectifs && (
                <View style={styles.objectifCard}>
                  <ThemedText style={styles.objectifLabel}>🎯 Objectifs</ThemedText>
                  <ThemedText style={styles.objectifText}>{chapter.objectifs}</ThemedText>
                </View>
              )}
            </View>

            {/* Contenu principal du chapitre */}
            {chapter.content && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>📖 Contenu du chapitre</ThemedText>
                <View style={styles.textCard}>
                  {renderHTMLContent(chapter.content)}
                </View>
              </View>
            )}

            {/* Supports de type TEXTE */}
            {textSupports.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>📝 Supports de cours</ThemedText>
                {textSupports.map((s, index) => {
                  const config = SUPPORT_CONFIG[s.type];
                  const isExpanded = expandedTextId === s.id;
                  return (
                    <View key={s.id} style={[styles.textSupportWrapper, index === textSupports.length - 1 && { marginBottom: 0 }]}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.supportCard,
                          isExpanded && styles.supportCardExpanded,
                          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => toggleTextSupport(s.id)}
                      >
                        <View style={[styles.supportIconBox, { backgroundColor: config.bg }]}>
                          <ThemedText style={styles.supportIconText}>{config.icon}</ThemedText>
                        </View>
                        <View style={styles.supportInfo}>
                          <ThemedText style={styles.supportName}>{s.nom || config.label}</ThemedText>
                          <ThemedText style={[styles.supportType, { color: config.color }]}>
                            {isExpanded ? '▼ Cliquez pour fermer' : '▶ Cliquez pour lire'}
                          </ThemedText>
                        </View>
                        <View style={[styles.supportAction, { backgroundColor: config.bg }]}>
                          <ThemedText style={[styles.supportActionText, { color: config.color }]}>
                            {isExpanded ? '−' : '+'}
                          </ThemedText>
                        </View>
                      </Pressable>

                      {isExpanded && s.contenu && (
                        <View style={styles.textContentExpanded}>
                          <View style={styles.textContentHeader}>
                            <View style={styles.textContentDot} />
                            <ThemedText style={styles.textContentTitle}>Contenu</ThemedText>
                          </View>
                          <View style={styles.textContentBody}>
                            {renderHTMLContent(s.contenu)}
                          </View>
                        </View>
                      )}
                      
                      {isExpanded && !s.contenu && (
                        <View style={styles.textContentEmpty}>
                          <ThemedText style={styles.textContentEmptyText}>
                            Aucun contenu disponible pour ce support.
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Ressources (PDF, PPT, IMAGE) - Version simplifiée */}
            {resourceSupports.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>📎 Ressources ({resourceSupports.length})</ThemedText>
                {resourceSupports.map((s) => {
                  const fileIcon = getResourceIcon(s.type);
                  const fileLabel = getResourceLabel(s.type);
                  const fileColor = getResourceColor(s.type);
                  const fileBg = getResourceBg(s.type);
                  
                  return (
                    <View key={s.id} style={styles.resourceWrapper}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.resourceCard,
                          pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => {
                          if (s.url) {
                            WebBrowser.openBrowserAsync(s.url);
                          }
                        }}
                      >
                        <View style={[styles.resourceIconBox, { backgroundColor: fileBg }]}>
                          <ThemedText style={styles.resourceIconText}>{fileIcon}</ThemedText>
                        </View>
                        <View style={styles.resourceInfo}>
                          <ThemedText style={styles.resourceName}>{s.nom || fileLabel}</ThemedText>
                          <ThemedText style={[styles.resourceType, { color: fileColor }]}>{fileLabel}</ThemedText>
                        </View>
                        <View style={[styles.resourceAction, { backgroundColor: fileBg }]}>
                          <ThemedText style={[styles.resourceActionText, { color: fileColor }]}>📖</ThemedText>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Vidéos */}
            {videos.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>🎬 Vidéos ({videos.length})</ThemedText>
                {videos.map(v => {
                  const config = SUPPORT_CONFIG[v.type];
                  return (
                    <Pressable
                      key={v.id}
                      style={({ pressed }) => [styles.supportCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                      onPress={() => handleVideoPress(v)}
                    >
                      <View style={[styles.supportIconBox, { backgroundColor: config.bg }]}>
                        <ThemedText style={styles.supportIconText}>{config.icon}</ThemedText>
                      </View>
                      <View style={styles.supportInfo}>
                        <ThemedText style={styles.supportName}>{v.nom || 'Vidéo'}</ThemedText>
                        <ThemedText style={[styles.supportType, { color: config.color }]}>Cliquer pour regarder</ThemedText>
                      </View>
                      <View style={[styles.supportAction, { backgroundColor: config.bg }]}>
                        <ThemedText style={[styles.supportActionText, { color: config.color }]}>▶</ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Autres supports */}
            {otherSupports.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>📎 Autres ressources</ThemedText>
                {otherSupports.map(s => {
                  const config = SUPPORT_CONFIG[s.type];
                  return (
                    <Pressable
                      key={s.id}
                      style={({ pressed }) => [styles.supportCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                      onPress={() => handleOpenURL(s.url)}
                    >
                      <View style={[styles.supportIconBox, { backgroundColor: config.bg }]}>
                        <ThemedText style={styles.supportIconText}>{config.icon}</ThemedText>
                      </View>
                      <View style={styles.supportInfo}>
                        <ThemedText style={styles.supportName}>{s.nom || config.label}</ThemedText>
                        <ThemedText style={[styles.supportType, { color: config.color }]}>{config.label}</ThemedText>
                      </View>
                      <View style={[styles.supportAction, { backgroundColor: config.bg }]}>
                        <ThemedText style={[styles.supportActionText, { color: config.color }]}>→</ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Quiz */}
            {chapter.quiz && (
              <View style={styles.quizSection}>
                <Pressable style={({ pressed }) => [styles.quizCard, pressed && { opacity: 0.85 }]} onPress={handleQuizPress}>
                  <View style={styles.quizIconBox}>
                    <ThemedText style={styles.quizIconText}>✏️</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.quizTitle}>Quiz Formatif</ThemedText>
                    <ThemedText style={styles.quizSubtitle}>{chapter.quiz.questions?.length || 0} questions</ThemedText>
                  </View>
                  <ThemedText style={styles.quizArrow}>→</ThemedText>
                </Pressable>

                {quizCompleted && (
                  <View style={{
                    backgroundColor: '#E8F5E9',
                    borderColor: '#86efac',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: '#166534', fontWeight: '700', fontSize: 14 }}>
                        🎉 Quiz réussi avec succès !
                      </ThemedText>
                      <ThemedText style={{ color: '#2d6a4f', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                        Résultat obtenu : <ThemedText style={{ fontWeight: '700', color: '#166534' }}>{quizScore}%</ThemedText>
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 20 }}>🌸</ThemedText>
                  </View>
                )}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Modal Vidéo */}
      {videoModalVisible && selectedVideo && (
        <VideoModal
          visible={videoModalVisible}
          videoUrl={selectedVideo.url}
          videoName={selectedVideo.nom}
          onClose={() => setVideoModalVisible(false)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },

  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: Spacing.four, alignItems: 'center', marginTop: 40 },
  errorTxt: { color: C.danger, fontWeight: '600', marginBottom: 12 },
  retryBtn: { backgroundColor: C.danger, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryTxt: { color: 'white', fontWeight: '700' },

  header: { marginBottom: Spacing.four },
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', lineHeight: 30, marginBottom: 12 },
  objectifCard: { backgroundColor: '#FFF7ED', borderLeftWidth: 3, borderLeftColor: C.secondary, padding: Spacing.three, borderRadius: 8 },
  objectifLabel: { fontWeight: '700', color: C.secondary, marginBottom: 4, fontSize: 13 },
  objectifText: { color: '#78350F', lineHeight: 22 },

  section: { marginBottom: Spacing.five },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: Spacing.three },

  textCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: Spacing.four, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    marginBottom: Spacing.two 
  },

  textSupportWrapper: { 
    marginBottom: Spacing.three,
  },
  
  textContentExpanded: {
    marginTop: 8,
    marginLeft: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  
  textContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  textContentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
    marginRight: 10,
  },
  
  textContentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.gray700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  textContentBody: {
    padding: 16,
  },
  
  textContentEmpty: {
    marginTop: 8,
    marginLeft: 56,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  
  textContentEmptyText: {
    fontSize: 14,
    color: C.gray500,
    textAlign: 'center',
  },

  supportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  supportCardExpanded: {
    borderColor: C.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  
  supportIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  supportIconText: { fontSize: 22 },
  supportInfo: { flex: 1 },
  supportName: { fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  supportType: { fontSize: 12 },
  supportAction: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  supportActionText: { fontWeight: '700', fontSize: 18 },

  // Styles pour les ressources (PDF, PPT, IMAGE)
  resourceWrapper: {
    marginBottom: Spacing.two,
  },

  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resourceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  resourceIconText: {
    fontSize: 22,
  },

  resourceInfo: {
    flex: 1,
  },

  resourceName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },

  resourceType: {
    fontSize: 12,
  },

  resourceAction: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resourceActionText: {
    fontWeight: '700',
    fontSize: 18,
  },

  quizSection: { marginBottom: Spacing.five },
  quizCard: { backgroundColor: 'white', borderRadius: 12, padding: Spacing.four, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  quizIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  quizIconText: { fontSize: 24 },
  quizTitle: { fontWeight: '700', color: '#1F2937', fontSize: 15 },
  quizSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  quizArrow: { color: C.primary, fontWeight: '700', fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: '#000000' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  modalTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  closeBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 40,
    alignItems: 'center',
  },
  closeBtnTxt: { color: 'white', fontWeight: '700', fontSize: 20 },

  videoPlayerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', padding: 32 },
  videoInfo: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  videoIcon: { fontSize: 64, marginBottom: 8 },
  videoTitle: { color: 'white', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  watchBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  watchBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  closeVideoBtn: { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  closeVideoBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
});