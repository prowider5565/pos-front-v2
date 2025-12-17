/**
 * Format a date string to verbose format: "December 4, 2025 20:20"
 * Supports localization for different languages
 */
export function formatVerboseDate(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString)
  
  // Format date based on locale
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
  
  const datePart = date.toLocaleDateString(locale, dateOptions)
  const timePart = date.toLocaleTimeString(locale, timeOptions)
  
  return `${datePart} ${timePart}`
}

/**
 * Format a date string to short format: "Dec 4, 2025"
 */
export function formatShortDate(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString)
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return date.toLocaleDateString(locale, options)
}
