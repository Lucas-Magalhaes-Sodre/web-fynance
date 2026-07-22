import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations, type AppLanguage } from './translations';

const languageKey = '@minha-receita:language';

function readInitialLanguage(): AppLanguage {
  const stored = localStorage.getItem(languageKey);
  return stored === 'en' || stored === 'es' || stored === 'pt-BR' ? stored : 'pt-BR';
}

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: translations['pt-BR'] },
    en: { translation: translations.en },
    es: { translation: translations.es }
  },
  lng: readInitialLanguage(),
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false
  },
  returnNull: false
});

export { i18n };
