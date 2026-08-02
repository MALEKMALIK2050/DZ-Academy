// src/app/chapter/[id].tsx
import React, { useEffect, useState } from 'react';
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
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import RenderHTML from 'react-native-render-html';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoadingScreen } from '@/components/loading-screen';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const C = {
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#ECFDF5',
  secondary: '#F97316',
  accent: '#2563EB',
  danger: '#DC2626',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#FAF8F5',
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
}

interface CourseChapterInfo {
  id: number;
  titre?: string;
  title?: string;
  ordre: number;
  hasQuiz?: boolean;
  quizScore?: number | null;
  quizCompleted?: boolean;
}

interface ChapterDetail {
  id: number;
  courseId: number;
  title?: string;
  titre?: string;
  content?: string;
  objectifs?: string;
  supports: Support[];
  quiz?: QuizInfo;
  prevChapter?: { id: number; titre?: string; title?: string };
  nextChapter?: { id: number; titre?: string; title?: string };
  courseChapters?: CourseChapterInfo[];
}

const SUPPORT_CONFIG: Record<SupportType, { icon: string; label: string; color: string; bg: string }> = {
  VIDEO:      { icon: '🎬', label: 'فيديو تعليمي',   color: '#DC2626', bg: '#FEF2F2' },
  PDF:        { icon: '📄', label: 'مستند PDF',     color: '#2563EB', bg: '#EFF6FF' },
  PPT:        { icon: '📊', label: 'عرض تقديمي',    color: '#D97706', bg: '#FFFBEB' },
  IMAGE:      { icon: '🖼️', label: 'صورة توضيحية',  color: '#059669', bg: '#ECFDF5' },
  SCORM:      { icon: '📦', label: 'وحدة تفاعلية',  color: '#7C3AED', bg: '#F5F3FF' },
  ARTICULATE: { icon: '🎯', label: 'محتوى مدمج',    color: '#0891B2', bg: '#ECFEFF' },
  TEXTE:      { icon: '📝', label: 'ملخص الدرس',    color: '#16A34A', bg: '#F0FDF4' },
  FORUM:      { icon: '💬', label: 'منتدى النقاش',   color: '#2563EB', bg: '#EFF6FF' },
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

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // نصوص موسعة
  const [expandedTexts, setExpandedTexts] = useState<Record<number, boolean>>({});
  // نافذة قائمة الفصول السريعة
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);

  const fetchChapter = async () => {
    try {
      setError(null);
      const res = await fetch(API_ENDPOINTS.chapterDetail(id as string), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`خطأ ${res.status}`);
      const data = await res.json();
      setChapter(data);

      // تسجيل إتمام قراءة الفصل للمتابعة البيداغوجية
      if (token && data.id) {
        fetch(API_ENDPOINTS.studentProgress, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chapterId: data.id, lu: true }),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('fetchChapter error:', err);
      setError('تعذر تحميل محتوى الفصل، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchChapter();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChapter();
  };

  const openExternalUrl = async (url?: string) => {
    if (!url) {
      Alert.alert('تنبيه', 'الرابط غير متوفر حالياً.');
      return;
    }
    try {
      const ytId = extractYouTubeId(url);
      const targetUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : url;
      await WebBrowser.openBrowserAsync(targetUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch (e) {
      Alert.alert('خطأ', 'تعذر فتح الملف أو الرابط.');
    }
  };

  if (loading) {
    return <LoadingScreen message="جاري تجهيز محتوى الفصل والوسائط..." />;
  }

  if (error || !chapter) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={{ fontSize: 36, marginBottom: 12 }}>⚠️</ThemedText>
        <ThemedText style={styles.errorText}>{error || 'الفصل غير متاح'}</ThemedText>
        <Pressable style={styles.retryBtn} onPress={fetchChapter}>
          <ThemedText style={styles.retryBtnTxt}>إعادة المحاولة</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const chapterTitle = chapter.title || chapter.titre || 'الفصل التعليمي';
  const supports = chapter.supports || [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: chapterTitle,
          headerBackTitle: 'الرجوع',
          headerTitleAlign: 'center',
          headerTintColor: '#059669',
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* عنوان الفصل وشريط التنقل السريع */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Pressable
              style={styles.drawerTrigger}
              onPress={() => setShowChaptersDrawer(true)}
            >
              <ThemedText style={styles.drawerTriggerTxt}>☰ فصول الدورة</ThemedText>
            </Pressable>
            <ThemedText style={styles.chapterTag}>درس تعليمي</ThemedText>
          </View>
          <ThemedText style={styles.chapterMainTitle}>{chapterTitle}</ThemedText>
        </View>

        {/* أهداف الفصل */}
        {chapter.objectifs ? (
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionCardTitle}>🎯 أهداف الدرس</ThemedText>
            <RenderHTML
              contentWidth={width - 40}
              source={{ html: `<div style="direction: rtl; text-align: right; font-size: 13px; line-height: 20px; color: #374151;">${chapter.objectifs}</div>` }}
            />
          </View>
        ) : null}

        {/* وسائط ودعائم الفصل (فيديو، مستندات، وحدات تفاعلية) */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionHeaderTitle}>📂 الوسائط والدعائم التعليمية</ThemedText>

          {supports.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>لم تتم إضافة وسائط لهذا الفصل بعد.</ThemedText>
            </View>
          ) : (
            supports.map((sup) => {
              const cfg = SUPPORT_CONFIG[sup.type] || SUPPORT_CONFIG.TEXTE;
              const isExpanded = expandedTexts[sup.id];

              return (
                <View key={sup.id} style={styles.supportCard}>
                  {/* شريط الدعامة */}
                  <View style={styles.supportHeader}>
                    <View style={[styles.supportBadge, { backgroundColor: cfg.bg }]}>
                      <ThemedText style={[styles.supportBadgeTxt, { color: cfg.color }]}>
                        {cfg.icon} {cfg.label}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.supportName} numberOfLines={1}>
                      {sup.nom || cfg.label}
                    </ThemedText>
                  </View>

                  {/* في حالة الفيديو، PDF، SCORM، PPT */}
                  {sup.url ? (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: cfg.color }]}
                      onPress={() => openExternalUrl(sup.url)}
                    >
                      <ThemedText style={styles.actionBtnTxt}>
                        {sup.type === 'VIDEO' ? 'مشاهدة الفيديو 🎬' : 'فتح المحتوى التعليمي ←'}
                      </ThemedText>
                    </Pressable>
                  ) : null}

                  {/* في حالة المحتوى النصي */}
                  {sup.contenu ? (
                    <View style={styles.textContent}>
                      <RenderHTML
                        contentWidth={width - 50}
                        source={{
                          html: `<div style="direction: rtl; text-align: right; font-size: 13px; line-height: 22px; color: #374151;">${
                            isExpanded ? sup.contenu : (sup.contenu.slice(0, 300) + (sup.contenu.length > 300 ? '...' : ''))
                          }</div>`,
                        }}
                      />
                      {sup.contenu.length > 300 ? (
                        <Pressable
                          onPress={() =>
                            setExpandedTexts((prev) => ({ ...prev, [sup.id]: !prev[sup.id] }))
                          }
                          style={styles.expandBtn}
                        >
                          <ThemedText style={styles.expandBtnTxt}>
                            {isExpanded ? 'عرض أقل ↑' : 'قراءة المزيد ↓'}
                          </ThemedText>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {/* زر الاختبار التكويني للفصل */}
        {chapter.quiz ? (
          <View style={styles.quizCard}>
            <View style={styles.quizCardTop}>
              <ThemedText style={{ fontSize: 32 }}>📝</ThemedText>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={styles.quizCardTitle}>اختبار الفصل التكويني</ThemedText>
                <ThemedText style={styles.quizCardDesc}>
                  تحقق من فهمك لنقاط الدرس عبر هذا الاختبار السريع لتحصيل النقاط وفتح الفصل الموالي.
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={styles.startQuizBtn}
              onPress={() => {
                if (chapter.quiz?.id) {
                  router.push({ pathname: '/quiz/[id]', params: { id: String(chapter.quiz.id) } });
                }
              }}
            >
              <ThemedText style={styles.startQuizBtnTxt}>بدء اختبار الفصل ✍️</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* شريط التنقل السابق / التالي */}
        <View style={styles.navRow}>
          {chapter.prevChapter ? (
            <Pressable
              style={styles.navBtn}
              onPress={() => {
                if (chapter.prevChapter?.id) {
                  router.push({ pathname: '/chapter/[id]', params: { id: String(chapter.prevChapter.id) } });
                }
              }}
            >
              <ThemedText style={styles.navBtnTxt}>← الفصل السابق</ThemedText>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {chapter.nextChapter ? (
            <Pressable
              style={[styles.navBtn, styles.nextNavBtn]}
              onPress={() => {
                if (chapter.nextChapter?.id) {
                  router.push({ pathname: '/chapter/[id]', params: { id: String(chapter.nextChapter.id) } });
                }
              }}
            >
              <ThemedText style={[styles.navBtnTxt, styles.nextNavBtnTxt]}>الفصل التالي →</ThemedText>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>

        {/* Modal قائمة فصول الدورة */}
        <Modal
          visible={showChaptersDrawer}
          transparent
          animationType="slide"
          onRequestClose={() => setShowChaptersDrawer(false)}
        >
          <Pressable style={styles.drawerOverlay} onPress={() => setShowChaptersDrawer(false)} />
          <View style={styles.drawerSheet}>
            <View style={styles.drawerHeader}>
              <Pressable onPress={() => setShowChaptersDrawer(false)}>
                <ThemedText style={styles.drawerClose}>✕</ThemedText>
              </Pressable>
              <ThemedText style={styles.drawerTitle}>قائمة فصول الدورة 📖</ThemedText>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {(chapter.courseChapters || []).map((ch, i) => {
                const isCurrent = ch.id === chapter.id;
                return (
                  <Pressable
                    key={ch.id}
                    style={[styles.drawerItem, isCurrent && styles.drawerItemCurrent]}
                    onPress={() => {
                      setShowChaptersDrawer(false);
                      if (!isCurrent) {
                        router.push({ pathname: '/chapter/[id]', params: { id: String(ch.id) } });
                      }
                    }}
                  >
                    <ThemedText style={styles.drawerItemArrow}>{isCurrent ? '●' : '←'}</ThemedText>
                    <ThemedText
                      style={[styles.drawerItemText, isCurrent && styles.drawerItemTextCurrent]}
                      numberOfLines={1}
                    >
                      {i + 1}. {ch.title || ch.titre}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { paddingHorizontal: 16 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  drawerTrigger: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  drawerTriggerTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  chapterTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chapterMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
    lineHeight: 26,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 8,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supportHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  supportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supportBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  supportName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  actionBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  textContent: {
    marginTop: 6,
  },
  expandBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  expandBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  quizCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  quizCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  quizCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#065F46',
    textAlign: 'right',
  },
  quizCardDesc: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'right',
    lineHeight: 18,
    marginTop: 2,
  },
  startQuizBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startQuizBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  navRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  nextNavBtn: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  navBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  nextNavBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  drawerClose: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  drawerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drawerItemCurrent: {
    backgroundColor: '#ECFDF5',
  },
  drawerItemText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
  drawerItemTextCurrent: {
    color: '#059669',
    fontWeight: '800',
  },
  drawerItemArrow: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});