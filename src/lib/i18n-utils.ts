/**
 * i18n Utility Functions
 * Helpers for formatting dates, numbers, and currency based on locale
 */

/**
 * Format date based on locale
 */
export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj)
}

/**
 * Format date and time based on locale
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj)
}

/**
 * Format number based on locale
 */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Format currency based on locale
 */
export function formatCurrency(
  value: number,
  locale: string,
  currency = 'UZS',
  options?: Intl.NumberFormatOptions
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    ...options,
  }

  return new Intl.NumberFormat(locale, defaultOptions).format(value)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  // Less than a minute
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute')
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour')
  }

  // Less than a month
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day')
  }

  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month')
  }

  // Years
  const diffInYears = Math.floor(diffInMonths / 12)
  return rtf.format(-diffInYears, 'year')
}

/**
 * Get locale-specific configuration
 */
export function getLocaleConfig(locale: string) {
  const configs: Record<string, {
    dateFormat: string
    timeFormat: string
    firstDayOfWeek: number
    currency: string
  }> = {
    en: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      firstDayOfWeek: 0, // Sunday
      currency: 'USD',
    },
    ru: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      firstDayOfWeek: 1, // Monday
      currency: 'RUB',
    },
    uz: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      firstDayOfWeek: 1, // Monday
      currency: 'UZS',
    },
  }

  return configs[locale] || configs.en
}
