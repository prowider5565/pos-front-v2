/**
 * Language Hook
 * Custom hook for managing language state and operations
 */

import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/i18n'

export function useLanguage() {
  const { i18n } = useTranslation()

  const currentLanguage = i18n.language
  const currentLanguageData = LANGUAGES[currentLanguage as keyof typeof LANGUAGES] || LANGUAGES.en

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const availableLanguages = Object.values(LANGUAGES)

  return {
    currentLanguage,
    currentLanguageData,
    changeLanguage,
    availableLanguages,
    isRTL: false, // None of our languages are RTL, but this is here for future extensibility
  }
}
