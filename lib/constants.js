// lib/constants.js — ثوابت مشتركة في جميع أنحاء المنصة — دزأكاديمي

export const MATIERES = [
  { value: "math",                label: "الرياضيات" },
  { value: "physique",            label: "الفيزياء والكيمياء" },
  { value: "svt",                 label: "علوم الحياة والأرض" },
  { value: "informatique",        label: "الإعلام الآلي" },
  { value: "histoire",            label: "التاريخ والجغرافيا" },
  { value: "francais",            label: "اللغة الفرنسية" },
  { value: "anglais",             label: "اللغة الإنجليزية" },
  { value: "arabe",               label: "اللغة العربية" },
  { value: "philosophie",         label: "الفلسفة" },
  { value: "education_islamique", label: "التربية الإسلامية" },
  { value: "allemand",            label: "اللغة الألمانية" },
  { value: "italien",             label: "اللغة الإيطالية" },
];

export const NIVEAUX = [
  { value: "college", label: "التعليم المتوسط" },
  { value: "lycee",   label: "التعليم الثانوي" },
];

// سنوات التعليم المتوسط (الجزائر)
export const ANNEES_COLLEGE = [
  "السنة الأولى متوسط",
  "السنة الثانية متوسط",
  "السنة الثالثة متوسط",
  "السنة الرابعة متوسط",
];

// سنوات التعليم الثانوي (الجزائر)
export const ANNEES_LYCEE = [
  "السنة الأولى ثانوي",
  "السنة الثانية ثانوي",
  "السنة الثالثة ثانوي",
];

export const ANNEES_ALL = [...ANNEES_COLLEGE, ...ANNEES_LYCEE];

// خريطة للاستخدام في التسجيل (تتطابق مع قيم قاعدة البيانات القديمة → عرض عربي)
export const CLASSE_LABELS = {
  // متوسط
  "السنة الأولى متوسط":  "السنة الأولى متوسط",
  "السنة الثانية متوسط": "السنة الثانية متوسط",
  "السنة الثالثة متوسط": "السنة الثالثة متوسط",
  "السنة الرابعة متوسط": "السنة الرابعة متوسط",
  // ثانوي
  "السنة الأولى ثانوي":  "السنة الأولى ثانوي",
  "السنة الثانية ثانوي": "السنة الثانية ثانوي",
  "السنة الثالثة ثانوي": "السنة الثالثة ثانوي (بكالوريا)",
  // قيم قديمة من النسخة الفرنسية — للتوافق مع السجلات الموجودة
  "6eme":      "السنة الأولى متوسط",
  "5eme":      "السنة الثانية متوسط",
  "4eme":      "السنة الثالثة متوسط",
  "3eme":      "السنة الرابعة متوسط",
  "1AS":       "السنة الأولى ثانوي",
  "2AS":       "السنة الثانية ثانوي",
  "Terminale": "السنة الثالثة ثانوي (بكالوريا)",
};

// دوال مساعدة
export function getMatiereLabel(value) {
  return MATIERES.find(m => m.value === value)?.label || value;
}

export function getNiveauLabel(value) {
  return NIVEAUX.find(n => n.value === value)?.label || value;
}

export function getClasseLabel(value) {
  return CLASSE_LABELS[value] || value;
}

// Couleurs par matière pour le nouveau design
export function getMatiereStyles(value) {
  const styles = {
    math: { color: "#3b82f6", background: "#eff6ff" },
    physique: { color: "#8b5cf6", background: "#f5f3ff" },
    svt: { color: "#10b981", background: "#ecfdf5" },
    informatique: { color: "#06b6d4", background: "#ecfeff" },
    histoire: { color: "#f59e0b", background: "#fffbeb" },
    francais: { color: "#ec4899", background: "#fdf2f8" },
    anglais: { color: "#f43f5e", background: "#fff1f2" },
    arabe: { color: "#14b8a6", background: "#f0fdfa" },
    philosophie: { color: "#6366f1", background: "#eef2ff" },
    education_islamique: { color: "#059669", background: "#ecfdf5" },
    allemand: { color: "#eab308", background: "#fefce8" },
    italien: { color: "#84cc16", background: "#f7fee7" },
  };
  return styles[value] || { color: "#475569", background: "#f8fafc" };
}

// Icônes principales par matière
export function getSubjectIcon(value) {
  const icons = {
    math: "📐",
    physique: "🧲",
    svt: "🧬",
    informatique: "💻",
    histoire: "🏛️",
    francais: "✒️",
    anglais: "🌍",
    arabe: "📖",
    philosophie: "💭",
    education_islamique: "🕌",
    allemand: "🇩🇪",
    italien: "🇮🇹",
  };
  return icons[value] || "📘";
}

// Symboles décoratifs par matière
export function getSubjectDecorations(value) {
  const decorations = {
    math: "π  √x  x²  Σ  ∫",
    physique: "⚛  ⚙️  🔋  📈",
    svt: "ADN  🌿  🔬  🧪",
    informatique: "</>  { }  01  #",
    histoire: "📜  🗺️  ⚔️  🏺",
    francais: "A  É  📝  🎭",
    anglais: "ABC  🗣️  📚  🎓",
    arabe: "ع  ب  ✍️  📜",
    philosophie: "?  💡  ∞  ⚖️",
    education_islamique: "☪  📿  🤲  📖",
    allemand: "Ä  Ö  Ü  ß",
    italien: "🎨  🎭  🏛️  È",
  };
  return decorations[value] || "📖  📝  ✏️";
}