// src/constants/algerian-education.ts
/**
 * ثوابت المنظومة التعليمية لمنصة دزأكاديمي DZ Academy
 * متطابقة تماماً مع lib/constants.js وقواعد بيانات المنصة
 */

// ── الأطوار التعليمية ─────────────────────────────────────────────
export const NIVEAUX = [
  { value: 'college', label: 'التعليم المتوسط', short: 'متوسط', icon: '🏫' },
  { value: 'lycee',   label: 'التعليم الثانوي', short: 'ثانوي', icon: '🎓' },
];

export const NIVEAUX_OPTIONS = [
  { value: '', label: 'جميع الأطوار التعليمية' },
  ...NIVEAUX,
];

// ── سنوات التعليم المتوسط (الجزائر) ──────────────────────────────
export const ANNEES_COLLEGE = [
  { value: 'السنة الأولى متوسط',  code: '1am', label: 'السنة الأولى متوسط (1AM)',  short: '1 متوسط' },
  { value: 'السنة الثانية متوسط', code: '2am', label: 'السنة الثانية متوسط (2AM)', short: '2 متوسط' },
  { value: 'السنة الثالثة متوسط', code: '3am', label: 'السنة الثالثة متوسط (3AM)', short: '3 متوسط' },
  { value: 'السنة الرابعة متوسط', code: '4am', label: 'السنة الرابعة متوسط (4AM - BEM)', short: '4 متوسط (BEM)' },
];

// ── سنوات التعليم الثانوي (الجزائر) ──────────────────────────────
export const ANNEES_LYCEE = [
  { value: 'السنة الأولى ثانوي',  code: '1as', label: 'السنة الأولى ثانوي (1AS)',  short: '1 ثانوي' },
  { value: 'السنة الثانية ثانوي', code: '2as', label: 'السنة الثانية ثانوي (2AS)', short: '2 ثانوي' },
  { value: 'السنة الثالثة ثانوي', code: '3as', label: 'السنة الثالثة ثانوي (3AS - بكالوريا)', short: '3 ثانوي (BAC)' },
];

export const ANNEES_ALL = [...ANNEES_COLLEGE, ...ANNEES_LYCEE];

// ── خريطة مطابقة السنوات (تطابق مع القيم القديمة والمختصرة) ─────
export const CLASSE_LABELS: Record<string, string> = {
  // متوسط
  'السنة الأولى متوسط':  'السنة الأولى متوسط',
  'السنة الثانية متوسط': 'السنة الثانية متوسط',
  'السنة الثالثة متوسط': 'السنة الثالثة متوسط',
  'السنة الرابعة متوسط': 'السنة الرابعة متوسط',
  '1am':                 'السنة الأولى متوسط',
  '2am':                 'السنة الثانية متوسط',
  '3am':                 'السنة الثالثة متوسط',
  '4am':                 'السنة الرابعة متوسط',
  '6eme':                'السنة الأولى متوسط',
  '5eme':                'السنة الثانية متوسط',
  '4eme':                'السنة الثالثة متوسط',
  '3eme':                'السنة الرابعة متوسط',

  // ثانوي
  'السنة الأولى ثانوي':  'السنة الأولى ثانوي',
  'السنة الثانية ثانوي': 'السنة الثانية ثانوي',
  'السنة الثالثة ثانوي': 'السنة الثالثة ثانوي (بكالوريا)',
  '1as':                 'السنة الأولى ثانوي',
  '2as':                 'السنة الثانية ثانوي',
  '3as':                 'السنة الثالثة ثانوي (بكالوريا)',
  '1AS':                 'السنة الأولى ثانوي',
  '2AS':                 'السنة الثانية ثانوي',
  'Terminale':           'السنة الثالثة ثانوي (بكالوريا)',
};

// ── المواد المعتمدة في منصة دزأكاديمي ─────────────────────────────
export const MATIERES = [
  { value: 'math',                label: 'الرياضيات',              icon: '📐', decorations: 'π √x x² Σ ∫' },
  { value: 'physique',            label: 'الفيزياء والكيمياء',       icon: '🧲', decorations: '⚛ ⚙️ 🔋 📈' },
  { value: 'svt',                 label: 'علوم الحياة والأرض',      icon: '🧬', decorations: 'ADN 🌿 🔬 🧪' },
  { value: 'informatique',        label: 'الإعلام الآلي',           icon: '💻', decorations: '</> { } 01 #' },
  { value: 'histoire',            label: 'التاريخ والجغرافيا',        icon: '🏛️', decorations: '📜 🗺️ ⚔️ 🏺' },
  { value: 'francais',            label: 'اللغة الفرنسية',          icon: '✒️', decorations: 'A É 📝 🎭' },
  { value: 'anglais',             label: 'اللغة الإنجليزية',         icon: '🌍', decorations: 'ABC 🗣️ 📚 🎓' },
  { value: 'arabe',               label: 'اللغة العربية',           icon: '📖', decorations: 'ع ب ✍️ 📜' },
  { value: 'philosophie',         label: 'الفلسفة',                icon: '💭', decorations: '? 💡 ∞ ⚖️' },
  { value: 'education_islamique', label: 'التربية الإسلامية',       icon: '🕌', decorations: '☪ 📿 🤲 📖' },
  { value: 'allemand',            label: 'اللغة الألمانية',         icon: '🇩🇪', decorations: 'Ä Ö Ü ß' },
  { value: 'italien',             label: 'اللغة الإيطالية',         icon: '🇮🇹', decorations: '🎨 🎭 🏛️ È' },
];

export const MATIERES_OPTIONS = [
  { value: '', label: 'جميع المواد الدراسية' },
  ...MATIERES.map(m => ({ value: m.value, label: `${m.icon} ${m.label}` })),
];

// ── دوال مساعدة للألوان والأنماط البيداغوجية ────────────────────────
export function getMatiereStyles(value?: string) {
  const v = (value || '').toLowerCase().trim();
  const styles: Record<string, { color: string; background: string; border: string }> = {
    math:                { color: '#2563EB', background: '#EFF6FF', border: '#BFDBFE' },
    physique:            { color: '#7C3AED', background: '#F5F3FF', border: '#DDD6FE' },
    svt:                 { color: '#059669', background: '#ECFDF5', border: '#A7F3D0' },
    informatique:        { color: '#0891B2', background: '#ECFEFF', border: '#A5F3FC' },
    histoire:            { color: '#D97706', background: '#FFFBEB', border: '#FDE68A' },
    francais:            { color: '#DB2777', background: '#FDF2F8', border: '#FBCFE8' },
    anglais:             { color: '#E11D48', background: '#FFF1F2', border: '#FECDD3' },
    arabe:               { color: '#0D9488', background: '#F0FDFA', border: '#99F6E4' },
    philosophie:         { color: '#4F46E5', background: '#EEF2FF', border: '#C7D2FE' },
    education_islamique: { color: '#16A34A', background: '#F0FDF4', border: '#BBF7D0' },
    allemand:            { color: '#CA8A04', background: '#FEFCE8', border: '#FEF08A' },
    italien:             { color: '#65A30D', background: '#F7FEE7', border: '#D9F99D' },
  };

  // البحث التقريبي بالاسم العربي أو الرمز
  for (const [key, val] of Object.entries(styles)) {
    if (v.includes(key)) return val;
  }
  if (v.includes('رياضيات')) return styles.math;
  if (v.includes('فيزياء') || v.includes('كيمياء')) return styles.physique;
  if (v.includes('طبيعة') || v.includes('علوم') || v.includes('أرض')) return styles.svt;
  if (v.includes('إعلام') || v.includes('حاسوب')) return styles.informatique;
  if (v.includes('تاريخ') || v.includes('جغرافيا') || v.includes('اجتماعيات')) return styles.histoire;
  if (v.includes('فرنسية')) return styles.francais;
  if (v.includes('إنجليزية') || v.includes('انجليزية')) return styles.anglais;
  if (v.includes('عربية')) return styles.arabe;
  if (v.includes('فلسفة')) return styles.philosophie;
  if (v.includes('إسلامية') || v.includes('دين')) return styles.education_islamique;
  if (v.includes('ألمانية')) return styles.allemand;
  if (v.includes('إيطالية')) return styles.italien;

  return { color: '#475569', background: '#F8FAFC', border: '#E2E8F0' };
}

export function getSubjectIcon(value?: string) {
  const v = (value || '').toLowerCase().trim();
  const found = MATIERES.find(m => m.value === v || v.includes(m.value) || v.includes(m.label));
  return found?.icon || '📘';
}

export function getMatiereLabel(value?: string) {
  if (!value) return '';
  const found = MATIERES.find(m => m.value === value || m.label === value);
  return found?.label || value;
}

export function getNiveauLabel(value?: string) {
  if (!value) return '';
  const found = NIVEAUX.find(n => n.value === value || n.label === value);
  return found?.label || value;
}

export function getClasseLabel(value?: string) {
  if (!value) return '';
  return CLASSE_LABELS[value] || value;
}

// ── إعدادات الدفع الجزائري في المنصة ───────────────────────────────
export const DZ_PAYMENT_CONFIG = {
  nomPlateforme: 'أكاديمية ديزاد للتعليم DZ Academy',
  ccp: {
    numero: '0021458963',
    cle: '45',
    titulaire: 'أكاديمية ديزاد DZ Academy',
  },
  baridimob: {
    rip: '00799999002145896345',
    titulaire: 'DZ ACADEMY LMS',
  },
  rib: {
    banque: 'بنك الجزائر الخارجي (BEA)',
    numero: '002 00012 1234567890 23',
    titulaire: 'SARL DZ ACADEMY',
  },
  whatsapp: '+213555123456',
  prixAbonnement: {
    mensuel: { id: 'mensuel', label: 'اشتراك شهري', prix: 2500 },
    trimestre: { id: 'trimestre', label: 'اشتراك ثلاثي', prix: 6000 },
    annuel: { id: 'annuel', label: 'اشتراك سنوي كامل', prix: 15000 },
  },
};
