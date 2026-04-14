import { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

const LANGUAGE_KEY = 'hrbrain_language';

export function LanguageProvider({
  children,
  initialLanguage = 'en',
  onLanguageChange,
}: {
  children: React.ReactNode;
  initialLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}) {
  const [language, setLanguageState] = useState(initialLanguage);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    onLanguageChange?.(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
