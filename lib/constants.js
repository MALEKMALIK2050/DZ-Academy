// lib/constants.js — Constantes partagées dans tout le LMS

export const MATIERES = [
  { value: "math",                label: "Mathématiques" },
  { value: "physique",            label: "Physique & Chimie" },
  { value: "svt",                 label: "SVT" },
  { value: "informatique",        label: "Informatique" },
  { value: "histoire",            label: "Histoire & Géographie" },
  { value: "francais",            label: "Français" },
  { value: "anglais",             label: "Anglais" },
  { value: "arabe",               label: "Langue Arabe" },
  { value: "philosophie",         label: "Philosophie" },
  { value: "education_islamique", label: "Éducation Islamique" },
  { value: "allemand",            label: "Allemand" },
  { value: "italien",             label: "Italien" },
];

export const NIVEAUX = [
  { value: "college", label: "Collège" },
  { value: "lycee",   label: "Lycée" },
];

export const ANNEES_COLLEGE = ["6ème", "5ème", "4ème", "3ème"];
export const ANNEES_LYCEE   = ["1ère AS", "2ème AS", "Terminale"];
export const ANNEES_ALL     = [...ANNEES_COLLEGE, ...ANNEES_LYCEE];

// Helpers
export function getMatiereLabel(value) {
  return MATIERES.find(m => m.value === value)?.label || value;
}

export function getNiveauLabel(value) {
  return NIVEAUX.find(n => n.value === value)?.label || value;
}
