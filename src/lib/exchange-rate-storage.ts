const EXCHANGE_RATE_KEY = 'exchange_rate'
const DEFAULT_EXCHANGE_RATE = '12500.00'

/**
 * Get the exchange rate from localStorage
 */
export function getExchangeRate(): string {
  try {
    const rate = localStorage.getItem(EXCHANGE_RATE_KEY)
    return rate || DEFAULT_EXCHANGE_RATE
  } catch {
    return DEFAULT_EXCHANGE_RATE
  }
}

/**
 * Set the exchange rate in localStorage
 */
export function setExchangeRate(rate: string): void {
  try {
    localStorage.setItem(EXCHANGE_RATE_KEY, rate)

    // Notify same-tab listeners immediately (storage event doesn't fire in same tab)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('exchange-rate:changed', { detail: { rate } })
      )
    }
  } catch (error) {
    console.error('Failed to save exchange rate:', error)
  }
}

/**
 * Get exchange rate as a number
 */
export function getExchangeRateNumber(): number {
  return parseFloat(getExchangeRate())
}
