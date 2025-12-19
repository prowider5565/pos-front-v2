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
    totalPayments,
    totalPaymentsUSD,
    calculateRemaining,
    isOverpaid,
  }
}
