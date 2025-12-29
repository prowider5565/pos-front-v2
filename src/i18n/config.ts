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
import suppliersEN from '@/locales/en/suppliers.json'
import clientsEN from '@/locales/en/clients.json'
import productsEN from '@/locales/en/products.json'
import settingsEN from '@/locales/en/settings.json'
import errorsEN from '@/locales/en/errors.json'
import debtsEN from '@/locales/en/debts.json'
import salesEN from '@/locales/en/sales.json'
import kassaEN from '@/locales/en/kassa.json'

import commonRU from '@/locales/ru/common.json'
import authRU from '@/locales/ru/auth.json'
import dashboardRU from '@/locales/ru/dashboard.json'
import usersRU from '@/locales/ru/users.json'
import suppliersRU from '@/locales/ru/suppliers.json'
import clientsRU from '@/locales/ru/clients.json'
import productsRU from '@/locales/ru/products.json'
import settingsRU from '@/locales/ru/settings.json'
import errorsRU from '@/locales/ru/errors.json'
import debtsRU from '@/locales/ru/debts.json'
import salesRU from '@/locales/ru/sales.json'
import kassaRU from '@/locales/ru/kassa.json'

import commonUZ from '@/locales/uz/common.json'
import authUZ from '@/locales/uz/auth.json'
import dashboardUZ from '@/locales/uz/dashboard.json'
import usersUZ from '@/locales/uz/users.json'
import suppliersUZ from '@/locales/uz/suppliers.json'
import clientsUZ from '@/locales/uz/clients.json'
import productsUZ from '@/locales/uz/products.json'
import settingsUZ from '@/locales/uz/settings.json'
import errorsUZ from '@/locales/uz/errors.json'
import debtsUZ from '@/locales/uz/debts.json'
import salesUZ from '@/locales/uz/sales.json'
import kassaUZ from '@/locales/uz/kassa.json'

// Language resources
const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    dashboard: dashboardEN,
    users: usersEN,
    suppliers: suppliersEN,
    clients: clientsEN,
    products: productsEN,
    settings: settingsEN,
    errors: errorsEN,
    debts: debtsEN,
    sales: salesEN,
    kassa: kassaEN,
  },
  ru: {
    common: commonRU,
    auth: authRU,
    dashboard: dashboardRU,
    users: usersRU,
    suppliers: suppliersRU,
    clients: clientsRU,
    products: productsRU,
    settings: settingsRU,
    errors: errorsRU,
    debts: debtsRU,
    sales: salesRU,
    kassa: kassaRU,
  },
  uz: {
    common: commonUZ,
    auth: authUZ,
    dashboard: dashboardUZ,
    users: usersUZ,
    suppliers: suppliersUZ,
    clients: clientsUZ,
    products: productsUZ,
    settings: settingsUZ,
    errors: errorsUZ,
    debts: debtsUZ,
    sales: salesUZ,
    kassa: kassaUZ,
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
