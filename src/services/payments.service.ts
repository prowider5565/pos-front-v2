import { apiService } from './api.service'

export type PaymentType = 'new-supplier' | 'old-supplier' | 'old-client'
export type Currency = 'UZS' | 'USD'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER'
export type DistributionStrategy = 'oldest' | 'newest' | 'least_amount' | 'largest_amount'

export interface PaymentItem {
  total_amount: string
  currency: Currency
}

export interface BulkPaymentPayload {
  payments: PaymentItem[]
  distribution_strategy: DistributionStrategy
  method: PaymentMethod
  supplier_id?: number
  client_id?: number
}

export interface SaleDirectPaymentPayload {
  sale_id: number
  amount: string
  currency: Currency
  method: PaymentMethod
}

export interface PaymentRecord {
  id: number
  amount_display: { uzs_amount: string; usd_amount: string }
  currency: string
  exchange_rate?: string
  amount?: string
  payment_method?: string
  created_at?: string
}

export interface SupplierPaymentsResponse {
  supplier: { id: number; full_name: string; company_name: string; phone_number: string }
  total_paid: string
  payments: PaymentRecord[]
}

export interface ClientPaymentsResponse {
  client: { id: number; full_name: string; phone_number: string }
  total_paid: string
  payments: PaymentRecord[]
}

export interface SalePaymentRecord {
  id: number
  sale: number
  amount: string
  currency: string
  payment_method: string
  created_at: string
}

const ENDPOINTS: Record<PaymentType, string> = {
  'new-supplier': '/payments/new-seller-debt-payments/bulk-payment/',
  'old-supplier': '/payments/old-seller-debt-payments/bulk-payment/',
  'old-client': '/payments/old-client-debt-payments/bulk-payment/',
}

export const paymentsService = {
  bulkPayment: async (type: PaymentType, payload: BulkPaymentPayload) => {
    return apiService.post(ENDPOINTS[type], payload)
  },
  saleDirectPayment: async (payload: SaleDirectPaymentPayload) => {
    return apiService.post('/payments/sale-payments/direct-payment/', payload)
  },
  getNewSupplierPayments: async (supplierId: number): Promise<SupplierPaymentsResponse> => {
    return apiService.get(`/payments/new-seller-debt-payments/entity-payments/?supplier_id=${supplierId}`)
  },
  getOldSupplierPayments: async (supplierId: number): Promise<SupplierPaymentsResponse> => {
    return apiService.get(`/payments/old-seller-debt-payments/supplier-payments/?supplier_id=${supplierId}`)
  },
  getOldClientPayments: async (clientId: number): Promise<ClientPaymentsResponse> => {
    return apiService.get(`/payments/old-client-debt-payments/client-payments/?client_id=${clientId}`)
  },
  getSalePayments: async (saleId: number): Promise<SalePaymentRecord[]> => {
    return apiService.get(`/payments/sale-payments/${saleId}/payments/`)
  },
}
