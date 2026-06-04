import { createContext, useState, useContext } from "react"

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("fr")

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}