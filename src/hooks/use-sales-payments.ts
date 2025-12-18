import { useState, useMemo, useCallback } from 'react'
import type { PaymentEntry, PaymentMethod, Currency } from '@/types/sales'

/**
 * Custom hook for managing payment state and operations
 */
export function useSalesPayments() {
  const [payments, setPayments] = useState<PaymentEntry[]>([])

  /**
   * Add a new payment entry
   */
  const addPayment = useCallback((
    method: PaymentMethod,
    currency: Currency,
    amount: string
  ) => {
    const newPayment: PaymentEntry = {
      id: `payment-${Date.now()}-${Math.random()}`,
      method,
      currency,
      amount,
    }
    setPayments(prev => [...prev, newPayment])
  }, [])

  /**
   * Remove a payment entry by ID
   */
  const removePayment = useCallback((paymentId: string) => {
    setPayments(prev => prev.filter(payment => payment.id !== paymentId))
  }, [])

  /**
   * Clear all payments
   */
  const clearPayments = useCallback(() => {
    setPayments([])
  }, [])

  /**
   * Add a quick full payment (Cash or Card) in specified currency
   */
  const addFullPayment = useCallback((
    method: PaymentMethod,
    currency: Currency,
    totalAmount: number,
    exchangeRate: number
  ) => {
    let amount: string

    if (currency === 'UZS') {
      // Full payment in UZS
      amount = totalAmount.toString()
    } else {
      // Full payment in USD - convert total from UZS to USD
      const usdAmount = totalAmount / exchangeRate
      amount = usdAmount.toFixed(2)
    }

    addPayment(method, currency, amount)
  }, [addPayment])

  /**
   * Calculate total payments in UZS
   */
  const totalPayments = useMemo(() => {
    return (exchangeRate: number) => {
      return payments.reduce((sum, payment) => {
        const amount = parseFloat(payment.amount) || 0
        
        if (payment.currency === 'USD') {
          // Convert USD to UZS
          return sum + (amount * exchangeRate)
        } else {
          // Already in UZS
          return sum + amount
        }
      }, 0)
    }
  }, [payments])

  /**
   * Get total payments in USD
   */
  const totalPaymentsUSD = useMemo(() => {
    return (exchangeRate: number) => {
      const totalUZS = totalPayments(exchangeRate)
      return totalUZS / exchangeRate
    }
  }, [totalPayments])

  /**
   * Calculate remaining amount after payments
   */
  const calculateRemaining = useCallback((
    totalAmount: number,
    exchangeRate: number
  ) => {
    const paid = totalPayments(exchangeRate)
    return Math.max(0, totalAmount - paid)
  }, [totalPayments])

  /**
   * Check if payment amount exceeds total
   */
  const isOverpaid = useCallback((
    totalAmount: number,
    exchangeRate: number
  ) => {
    const paid = totalPayments(exchangeRate)
    return paid > totalAmount
  }, [totalPayments])

  return {
    payments,
    addPayment,
    removePayment,
    clearPayments,
    addFullPayment,
    totalPayments,
    totalPaymentsUSD,
    calculateRemaining,
    isOverpaid,
  }
}
