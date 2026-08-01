import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { PaletteMode } from '@mui/material';
import { i18n } from '@/i18n';
import { type AppLanguage, type TranslationKey } from '@/i18n/translations';
import {
  currencyExplicitKey,
  currencyKey,
  defaultCurrencyForLanguage,
  isAppCurrency,
  type AppCurrency
} from '@/utils/format';

type PreferencesContextValue = {
  themeMode: PaletteMode;
  language: AppLanguage;
  currency: AppCurrency;
  setThemeMode: (mode: PaletteMode) => void;
  toggleThemeMode: () => void;
  setLanguage: (language: AppLanguage) => void;
  setCurrency: (currency: AppCurrency) => void;
  t: (key: TranslationKey) => string;
};

const themeKey = '@minha-receita:theme-mode';
const languageKey = '@minha-receita:language';

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readThemeMode(): PaletteMode {
  const stored = localStorage.getItem(themeKey);
  return stored === 'dark' ? 'dark' : 'light';
}

function readLanguage(): AppLanguage {
  const stored = localStorage.getItem(languageKey);
  return stored === 'en' || stored === 'es' || stored === 'pt-BR' ? stored : 'pt-BR';
}

function readCurrency(language: AppLanguage): AppCurrency {
  const stored = localStorage.getItem(currencyKey);
  return isAppCurrency(stored) ? stored : defaultCurrencyForLanguage(language);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<PaletteMode>(readThemeMode);
  const [language, setLanguageState] = useState<AppLanguage>(readLanguage);
  const [currency, setCurrencyState] = useState<AppCurrency>(() => readCurrency(readLanguage()));

  useEffect(() => {
    localStorage.setItem(themeKey, themeMode);
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(languageKey, language);
    document.documentElement.lang = language;
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    localStorage.setItem(currencyKey, currency);
  }, [currency]);

  function setLanguage(languageValue: AppLanguage) {
    setLanguageState(languageValue);
    if (localStorage.getItem(currencyExplicitKey) !== 'true') {
      setCurrencyState(defaultCurrencyForLanguage(languageValue));
    }
  }

  function setCurrency(currencyValue: AppCurrency) {
    localStorage.setItem(currencyExplicitKey, 'true');
    setCurrencyState(currencyValue);
  }

  const value = useMemo<PreferencesContextValue>(
    () => ({
      themeMode,
      language,
      currency,
      setThemeMode: setThemeModeState,
      toggleThemeMode: () => setThemeModeState((current) => (current === 'light' ? 'dark' : 'light')),
      setLanguage,
      setCurrency,
      t: (key) => i18n.t(key, { lng: language })
    }),
    [currency, language, themeMode]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences deve ser usado dentro de PreferencesProvider.');
  }

  return context;
}
