import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { translations } from "../i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("scms_lang") || "en");

  // Update HTML language class for font size adjustments
  useEffect(() => {
    document.documentElement.classList.remove("lang-en", "lang-mm");
    document.documentElement.classList.add(`lang-${language}`);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    const next = language === "en" ? "mm" : "en";
    setLanguage(next);
    localStorage.setItem("scms_lang", next);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: translations[language],
    }),
    [language, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
