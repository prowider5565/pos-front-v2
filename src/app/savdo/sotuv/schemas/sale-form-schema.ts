import { z } from 'zod'

/**
 * Validation schema for cart item
 */
export const cartItemSchema = z.object({
  product_id: z.number().positive('Product ID must be positive'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  available_stock: z.number().min(0, 'Stock cannot be negative'),
}).refine(
  (data) => data.quantity <= data.available_stock,
  {
    message: 'Quantity exceeds available stock',
    path: ['quantity'],
  }
)

/**
 * Validation schema for payment
 */
export const paymentSchema = z.object({
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER'] as const),
  currency: z.enum(['UZS', 'USD'] as const),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Amount must be a positive number'
    ),
})

/**
 * Validation schema for the complete sale form
 */
export const saleFormSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'At least one item is required'),
  
  payments: z.array(paymentSchema).optional(),
  
  exchange_rate: z.string()
    .min(1, 'Exchange rate is required')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Exchange rate must be a positive number'
    ),
  
  client_id: z.number().optional(),
  
  discount_amount: z.string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Discount must be a non-negative number'
    ),
  
  notes: z.string().optional(),
  
  needs_cheque: z.boolean().optional(),
}).refine(
  (data) => {
    // Calculate total and remaining amount
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity, 0)
    const discount = parseFloat(data.discount_amount || '0')
    const total = subtotal - discount
    
    // Calculate total payments in UZS
    const exchangeRate = parseFloat(data.exchange_rate)
    const totalPayments = (data.payments || []).reduce((sum, payment) => {
      const amount = parseFloat(payment.amount)
      return sum + (payment.currency === 'USD' ? amount * exchangeRate : amount)
    }, 0)
    
    const remaining = total - totalPayments
    
    // If there's remaining debt, client_id is required
    if (remaining > 0 && !data.client_id) {
      return false
    }
    
    return true
  },
  {
    message: 'Client is required when there is remaining debt',
    path: ['client_id'],
  }
)

/**
 * Type inference from schema
 */
export type SaleFormData = z.infer<typeof saleFormSchema>
export type CartItemData = z.infer<typeof cartItemSchema>
export type PaymentData = z.infer<typeof paymentSchema>
