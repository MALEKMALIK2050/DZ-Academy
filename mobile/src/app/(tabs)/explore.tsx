import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, View, Pressable,
  ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { API_ENDPOINTS } from '@/constants/api';
import { BottomTabInset, Spacing } from '@/constants/theme';

const Colors = {
  primary: '#16A34A',
  secondary: '#F97316',
  accent: '#208AEF',
  lightGray: '#F3F4F6',
  darkGray: '#6B7280',
};

// ── Constants ─────────────────────────────────────────
const NIVEAUX = [
  { value: '', label: 'Tous les niveaux' },
  { value: 'college', label: '🏫 Collège' },
  { value: 'lycee',   label: '🎓 Lycée' },
];
const ANNEES_COLLEGE = ['6ème', '5ème', '4ème', '3ème'];
const ANNEES_LYCEE   = ['1ère AS', '2ème AS', 'Terminale'];
const MATIERES = [
  { value: '',                    label: 'Toutes les matières' },
  { value: 'math',                label: '📐 Mathématiques' },
  { value: 'physique',            label: '⚗️ Physique & Chimie' },
  { value: 'svt',                 label: '🌿 SVT' },
  { value: 'informatique',        label: '💻 Informatique' },
  { value: 'histoire',            label: '🌍 Histoire & Géo' },
  { value: 'francais',            label: '📖 Français' },
  { value: 'anglais',             label: '🇬🇧 Anglais' },
  { value: 'arabe',               label: '📜 Langue Arabe' },
  { value: 'philosophie',         label: '🤔 Philosophie' },
  { value: 'education_islamique', label: '🕌 Éducation Islamique' },
  { value: 'allemand',            label: '🇩🇪 Allemand' },
  { value: 'italien',             label: '🇮🇹 Italien' },
];

interface Course {
  id: number;
  title: string;
  description?: string;
  matiere?: string;
  niveau?: string;
  annee?: string;
  prix?: number;
  chapters?: { id: number }[];
  teachers?: { id: number; nom: string; prenom: string }[];
  enrollments?: { id: number; statut: string; typePaiement: string }[];
  cooldownLocked?: boolean;
  lockedUntil?: string;
}
interface EnrollmentItem {
  id: number; statut: string; typePaiement: string;
  progression?: number; completed?: boolean; course: Course;
}

// ── Subject style helper ──
function getSubjectStyle(mat?: string) {
  const m = mat?.toLowerCase() || '';
  if (m.includes('math') || m === 'math') return { primary: '#3182CE', secondary: '#2B6CB0', bg: '#EBF8FF', icon: '📐' };
  if (m.includes('physique') || m === 'physique') return { primary: '#805AD5', secondary: '#6B46C1', bg: '#FAF5FF', icon: '⚛️' };
  if (m.includes('svt') || m === 'svt') return { primary: '#38A169', secondary: '#2F855A', bg: '#F0FFF4', icon: '🧬' };
  if (m.includes('info') || m.includes('tech') || m === 'informatique') return { primary: '#00B5D8', secondary: '#0097A7', bg: '#E6FFFA', icon: '💻' };
  if (m.includes('fran') || m === 'francais') return { primary: '#DD6B20', secondary: '#C05621', bg: '#FFFAF0', icon: '📚' };
  if (m.includes('anglais') || m === 'anglais') return { primary: '#E53E3E', secondary: '#C53030', bg: '#FFF5F5', icon: '🌍' };
  if (m.includes('arabe') || m === 'arabe') return { primary: '#059669', secondary: '#047857', bg: '#ECFDF5', icon: '📖' };
  if (m.includes('histoire') || m === 'histoire') return { primary: '#D69E2E', secondary: '#B7791F', bg: '#FFFFF0', icon: '🏺' };
  if (m.includes('philo') || m === 'philosophie') return { primary: '#4A5568', secondary: '#2D3748', bg: '#F7FAFC', icon: '💭' };
  if (m.includes('islam') || m === 'education_islamique') return { primary: '#059669', secondary: '#047857', bg: '#ECFDF5', icon: '🕌' };
  return { primary: '#4A5568', secondary: '#2D3748', bg: '#F7FAFC', icon: '✨' };
}

// ── PickerModal ─────────────────────────────────────────
function PickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string;
  options: { value: string; label: string }[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pk.overlay} onPress={onClose} />
      <View style={pk.sheet}>
        <View style={pk.header}>
          <ThemedText style={pk.title}>{title}</ThemedText>
          <Pressable onPress={onClose}><ThemedText style={pk.close}>✕</ThemedText></Pressable>
        </View>
        <ScrollView>
          {options.map(opt => (
            <Pressable key={opt.value} style={[pk.option, selected === opt.value && pk.optionSelected]}
              onPress={() => { onSelect(opt.value); onClose(); }}>
              <ThemedText style={[pk.optionText, selected === opt.value && pk.optionTextSelected]}>
                {opt.label}
              </ThemedText>
              {selected === opt.value && <ThemedText style={pk.checkmark}>✓</ThemedText>}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Screen ─────────────────────────────────────────
export default function CatalogueScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [niveau, setNiveau] = useState('');
  const [annee, setAnnee] = useState('');
  const [matiere, setMatiere] = useState('');
  const [showNiveauPicker, setShowNiveauPicker]   = useState(false);
  const [showAnneePicker, setShowAnneePicker]     = useState(false);
  const [showMatierePicker, setShowMatierePicker] = useState(false);

  // Pour le paiement
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState<number | null>(null);

  const anneesDisponibles = niveau === 'college' ? ANNEES_COLLEGE : niveau === 'lycee' ? ANNEES_LYCEE : [...ANNEES_COLLEGE, ...ANNEES_LYCEE];
  const anneeOptions = [{ value: '', label: 'Toutes les années' }, ...anneesDisponibles.map(a => ({ value: a, label: a }))];

  const fetchCourses = async (niv = niveau, ann = annee, mat = matiere) => {
    try {
      setError(null);
      if (token) {
        const params = new URLSearchParams();
        if (niv) params.append('niveau', niv);
        if (ann) params.append('annee', ann);
        if (mat) params.append('matiere', mat);
        const qs = params.toString();
        const url = `${API_ENDPOINTS.studentCourses}${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setCourses(Array.isArray(data.catalogue) ? data.catalogue : []);
        setEnrollments(Array.isArray(data.enrollments) ? data.enrollments : []);
      } else {
        const res = await fetch(API_ENDPOINTS.cataloguePublic({ niveau: niv || undefined, annee: ann || undefined, matiere: mat || undefined }));
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
        setEnrollments([]);
      }
    } catch {
      setError('Erreur lors du chargement du catalogue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [token]);

  const applyFilter = (niv: string, ann: string, mat: string) => {
    setLoading(true); fetchCourses(niv, ann, mat);
  };

  const handleNiveauSelect = (val: string) => {
    setNiveau(val); setAnnee(''); applyFilter(val, '', matiere);
  };
  const handleAnneeSelect = (val: string) => {
    setAnnee(val); applyFilter(niveau, val, matiere);
  };
  const handleMatiereSelect = (val: string) => {
    setMatiere(val); applyFilter(niveau, annee, val);
  };
  const resetFilters = () => {
    setNiveau(''); setAnnee(''); setMatiere(''); setSearchQuery('');
    setLoading(true); fetchCourses('', '', '');
  };

  const requestEnrollment = async (courseId: number, typePaiement: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.studentCourses, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId, typePaiement }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      fetchCourses();
      Alert.alert("Succès", "Votre demande d'inscription a été envoyée !");
    } catch (e: any) { setError(e.message || "Erreur lors de l'inscription"); }
  };

  const getEnrollmentStatus = (courseId: number) => {
    const enrol = enrollments.find(e => e.course?.id === courseId);
    if (enrol) return enrol.statut;
    const course = courses.find(c => c.id === courseId);
    return course?.enrollments?.[0]?.statut || null;
  };

  const filteredCourses = courses.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  const isFirstCourseOfSubject = (courseId: number, matiere?: string, annee?: string) => {
    if (!matiere || !annee) return false;
    const subjectCourses = courses.filter(c => c.matiere === matiere && c.annee === annee);
    if (subjectCourses.length === 0) return false;
    const minId = Math.min(...subjectCourses.map(c => c.id));
    return courseId === minId;
  };

  const hasFilters = !!(niveau || annee || matiere);

  return (
    <ThemedView style={s.container}>
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.content, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses(); }} />}
      >
        <View style={s.header}>
          <ThemedText type="title">Catalogue</ThemedText>
          <ThemedText type="small" style={s.subtitle}>{courses.length} cours disponibles</ThemedText>
        </View>

        {/* Filtres */}
        <View style={s.filtersRow}>
          <Pressable style={[s.filterBtn, niveau ? s.filterBtnActive : null]} onPress={() => setShowNiveauPicker(true)}>
            <ThemedText style={[s.filterBtnTxt, niveau ? s.filterBtnTxtActive : null]} numberOfLines={1}>
              {niveau ? (niveau === 'college' ? '🏫 المتوسط' : '🎓 الثانوي') : '🏫 المستوى ▾'}
            </ThemedText>
          </Pressable>
          
          {!!niveau && (
            <Pressable style={[s.filterBtn, annee ? s.filterBtnActive : null]} onPress={() => setShowAnneePicker(true)}>
              <ThemedText style={[s.filterBtnTxt, annee ? s.filterBtnTxtActive : null]} numberOfLines={1}>
                {annee ? `📅 ${anneeOptions.find(a => a.value === annee)?.label || annee}` : '📅 القسم ▾'}
              </ThemedText>
            </Pressable>
          )}

          {!!annee && (
            <Pressable style={[s.filterBtn, matiere ? s.filterBtnActive : null]} onPress={() => setShowMatierePicker(true)}>
              <ThemedText style={[s.filterBtnTxt, matiere ? s.filterBtnTxtActive : null]} numberOfLines={1}>
                {matiere ? `📘 ${MATIERES.find(m => m.value === matiere)?.label.replace(/^[^\s]+\s/, '') || matiere}` : '📘 المادة ▾'}
              </ThemedText>
            </Pressable>
          )}
        </View>

        {hasFilters && (
          <Pressable style={s.resetBtn} onPress={resetFilters}>
            <ThemedText style={s.resetBtnTxt}>✕ Réinitialiser les filtres</ThemedText>
          </Pressable>
        )}

        <PickerModal visible={showNiveauPicker} title="Choisir un niveau" options={NIVEAUX} selected={niveau} onSelect={handleNiveauSelect} onClose={() => setShowNiveauPicker(false)} />
        <PickerModal visible={showAnneePicker} title="Choisir une année" options={anneeOptions} selected={annee} onSelect={handleAnneeSelect} onClose={() => setShowAnneePicker(false)} />
        <PickerModal visible={showMatierePicker} title="Choisir une matière" options={MATIERES} selected={matiere} onSelect={handleMatiereSelect} onClose={() => setShowMatierePicker(false)} />

        <PickerModal 
          visible={selectedCourseForPayment !== null} 
          title="Type d'inscription" 
          options={[
            { value: 'COURS_SEUL', label: 'Ce cours uniquement (Mensuel)' },
            { value: 'PARCOURS_COMPLET', label: 'Parcours complet (Annuel)' }
          ]} 
          selected="" 
          onSelect={(val) => {
            if (selectedCourseForPayment !== null) {
              requestEnrollment(selectedCourseForPayment, val);
            }
          }} 
          onClose={() => setSelectedCourseForPayment(null)} 
        />

        {error && <View style={s.errorBox}><ThemedText style={s.errorTxt}>{error}</ThemedText></View>}

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /><ThemedText type="small" style={{ marginTop: 8, color: '#6B7280' }}>Chargement...</ThemedText></View>
        ) : filteredCourses.length === 0 ? (
          <View style={s.center}>
            <ThemedText type="subtitle" style={{ color: '#374151', marginBottom: 12 }}>
              {hasFilters ? '🔎 Aucun cours trouvé' : '📚 Aucun cours disponible'}
            </ThemedText>
            {hasFilters && <Pressable style={s.resetBtn} onPress={resetFilters}><ThemedText style={s.resetBtnTxt}>Effacer les filtres</ThemedText></Pressable>}
          </View>
        ) : (
          <View style={s.list}>
            {filteredCourses.map(course => {
              const status = getEnrollmentStatus(course.id);
              const isEnrolled = status === 'PAYE' || status === 'GRATUIT';
              const isPending  = status === 'EN_ATTENTE';
              const chapCount  = course.chapters?.length ?? 0;
              const teacher    = course.teachers?.[0];
              
              const subjectStyle = getSubjectStyle(course.matiere);
              const color = subjectStyle.primary;
              const bgColor = subjectStyle.bg;
              const icon = subjectStyle.icon;

              return (
                <Pressable key={course.id}
                  style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    if (course.cooldownLocked && course.lockedUntil) {
                      const date = new Date(course.lockedUntil).toLocaleDateString('fr-FR');
                      Alert.alert(
                        "Cours verrouillé 🔒",
                        `Veuillez patienter 5 jours après la fin de votre cours précédent de ${course.matiere}.\n\nCe cours sera disponible le ${date}.`
                      );
                      return;
                    }
                    if (isEnrolled) {
                      router.push({ pathname: '/course/[id]', params: { id: course.id } });
                    } else if (!isPending) {
                      if (isFirstCourseOfSubject(course.id, course.matiere, course.annee)) {
                        router.push({ pathname: '/course/[id]', params: { id: course.id } });
                      } else {
                        setSelectedCourseForPayment(course.id);
                      }
                    }
                  }}
                >
                  <View style={[s.cardContent, { borderColor: '#E2E8F0', borderWidth: 1 }]}>
                    <View style={[s.banner, { backgroundColor: bgColor }]}>
                      <ThemedText style={[s.bannerIcon, { fontSize: 48 }]}>{icon}</ThemedText>
                      {(course.niveau || course.annee) && (
                        <View style={[s.bannerBadge, { backgroundColor: color }]}>
                          <ThemedText style={[s.bannerBadgeTxt, { color: 'white' }]}>
                            {course.niveau === 'college' ? 'المتوسط' : course.niveau === 'lycee' ? 'الثانوي' : course.niveau}
                            {course.annee ? ` • ${course.annee}` : ''}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={s.info}>
                      <ThemedText type="subtitle" style={[s.cardTitle, { color: '#1E293B', fontSize: 18 }]} numberOfLines={2}>{course.title}</ThemedText>
                      <View style={s.tags}>
                        {course.matiere && <View style={[s.tag, { backgroundColor: bgColor }]}><ThemedText style={[s.tagTxt, { color: color }]}>📘 {MATIERES.find(m => m.value === course.matiere)?.label || course.matiere}</ThemedText></View>}
                        {chapCount > 0 && <View style={s.tag}><ThemedText style={s.tagTxt}>📖 {chapCount} فصل</ThemedText></View>}
                      </View>
                      {teacher && <ThemedText type="small" style={s.teacher}>👨‍🏫 {teacher.prenom} {teacher.nom}</ThemedText>}
                    </View>
                    <View style={[
                      s.accessBtn, 
                      course.cooldownLocked && s.accessBtnLocked,
                      isPending && !course.cooldownLocked && s.accessBtnPending, 
                      isEnrolled && !course.cooldownLocked && s.accessBtnEnrolled,
                      !isEnrolled && !isPending && !course.cooldownLocked && isFirstCourseOfSubject(course.id, course.matiere, course.annee) && { backgroundColor: '#F97316' },
                      !isEnrolled && !isPending && !course.cooldownLocked && !isFirstCourseOfSubject(course.id, course.matiere, course.annee) && { backgroundColor: color }
                    ]}>
                      <ThemedText style={s.accessBtnTxt}>
                        {course.cooldownLocked ? '🔒 دورة مقفلة' : isEnrolled ? '📖 الدخول إلى الدورة' : isPending ? '⏳ قيد الانتظار' : isFirstCourseOfSubject(course.id, course.matiere, course.annee) ? '🚀 حاول مجانا' : "📝 طلب الوصول"}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {!loading && courses.length > 0 && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.three }}>
            <ThemedText type="small" style={{ color: '#9CA3AF' }}>{filteredCourses.length} cours affichés</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.four },
  header: { marginBottom: Spacing.three },
  subtitle: { color: '#6B7280', marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: Spacing.three, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: Spacing.three },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  searchIcon: { fontSize: 18 },
  filtersRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  filterBtn: { flex: 1, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  filterBtnTxt: { fontSize: 12, color: '#374151', fontWeight: '600' },
  filterBtnTxtActive: { color: Colors.primary },
  resetBtn: { alignSelf: 'center', marginBottom: Spacing.three, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FEE2E2' },
  resetBtnTxt: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  errorBox: { backgroundColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: '#DC2626', padding: Spacing.three, borderRadius: 8, marginBottom: Spacing.four },
  errorTxt: { color: '#DC2626', fontWeight: '500' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.six },
  list: { gap: Spacing.three, marginBottom: Spacing.four },
  card: { borderRadius: 12, overflow: 'hidden' },
  cardContent: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  banner: { height: 90, alignItems: 'center', justifyContent: 'center' },
  bannerIcon: { fontSize: 42 },
  bannerBadge: { position: 'absolute', bottom: 6, left: 10, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  bannerBadgeTxt: { color: 'white', fontSize: 11, fontWeight: '600' },
  info: { padding: Spacing.three, gap: Spacing.two },
  cardTitle: { fontWeight: '600', color: '#1F2937' },
  cardDesc: { color: '#6B7280' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagTxt: { fontSize: 11, color: '#374151', fontWeight: '500' },
  teacher: { color: '#6B7280', marginTop: 2 },
  accessBtn: { backgroundColor: Colors.primary, paddingVertical: 12, alignItems: 'center' },
  accessBtnPending: { backgroundColor: '#D97706' },
  accessBtnEnrolled: { backgroundColor: '#2563EB' },
  accessBtnLocked: { backgroundColor: '#9CA3AF' },
  accessBtnTxt: { color: 'white', fontWeight: '700', fontSize: 14 },
});

const pk = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontWeight: '700', fontSize: 16, color: '#1F2937' },
  close: { fontSize: 18, color: '#6B7280' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.four, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionSelected: { backgroundColor: '#F0FDF4' },
  optionText: { fontSize: 15, color: '#374151' },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
  checkmark: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});