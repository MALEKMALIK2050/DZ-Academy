import fr from "../locales/fr.json"
import en from "../locales/en.json"
import ar from "../locales/ar.json"

const translations = { fr, en, ar }

export function t(lang, key) {
  return translations[lang][key] || key
}