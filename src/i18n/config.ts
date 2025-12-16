/**
 * i18n Configuration
 * Internationalization setup with language detection and persistence
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import commonEN from '@/locales/en/common.json'
import authEN from '@/locales/en/auth.json'
import dashboardEN from '@/locales/en/dashboard.json'
import usersEN from '@/locales/en/users.json'
import settingsEN from '@/locales/en/settings.json'
import errorsEN from '@/locales/en/errors.json'

import commonRU from '@/locales/ru/common.json'
import authRU from '@/locales/ru/auth.json'
import dashboardRU from '@/locales/ru/dashboard.json'
import usersRU from '@/locales/ru/users.json'
import settingsRU from '@/locales/ru/settings.json'
import errorsRU from '@/locales/ru/errors.json'

import commonUZ from '@/locales/uz/common.json'
import authUZ from '@/locales/uz/auth.json'
import dashboardUZ from '@/locales/uz/dashboard.json'
import usersUZ from '@/locales/uz/users.json'
import settingsUZ from '@/locales/uz/settings.json'
import errorsUZ from '@/locales/uz/errors.json'

// Language resources
const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    dashboard: dashboardEN,
    users: usersEN,
    settings: settingsEN,
    errors: errorsEN,
  },
  ru: {
    common: commonRU,
    auth: authRU,
    dashboard: dashboardRU,
    users: usersRU,
    settings: settingsRU,
    errors: errorsRU,
  },
  uz: {
    common: commonUZ,
    auth: authUZ,
    dashboard: dashboardUZ,
    users: usersUZ,
    settings: settingsUZ,
    errors: errorsUZ,
  },
}

// Supported languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  uz: { code: 'uz', name: 'Uzbek', nativeName: "O'zbek" },
} as const

export const DEFAULT_LANGUAGE = 'en'

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'ru', 'uz'],
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  })

export default i18n
