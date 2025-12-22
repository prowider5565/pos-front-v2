import { apiService } from './api.service'
import { API_ENDPOINTS } from '@/config/api'
import type { 
  SupplierDebtsResponse, 
  ClientDebtsResponse,
  CreateOldSupplierDebtRequest,
  CreateOldClientDebtRequest,
  SupplierOldDebtsDetailResponse,
  ClientOldDebtsDetailResponse,
  DirectOldDebtPaymentRequest,
  DirectOldSupplierDebtPaymentRequest,
  SupplierOldDebtPaymentHistoryResponse,
  ClientOldDebtPaymentHistoryResponse,
  OldDebtsForChequeResponse
} from '@/types/debts'

export const debtsService = {
  getNewSupplierDebts: async (params?: { page?: number; search?: string }): Promise<SupplierDebtsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.DEBTS.SUPPLIERS_NEW}?${queryParams.toString()}`
      : API_ENDPOINTS.DEBTS.SUPPLIERS_NEW
    
    return apiService.get(endpoint)
  },

  getOldSupplierDebts: async (params?: { page?: number; search?: string }): Promise<SupplierDebtsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.DEBTS.SUPPLIERS_OLD}?${queryParams.toString()}`
      : API_ENDPOINTS.DEBTS.SUPPLIERS_OLD
    
    return apiService.get(endpoint)
  },

  getSaleClientDebts: async (params?: { page?: number; search?: string }): Promise<ClientDebtsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.DEBTS.CLIENTS_SALE}?${queryParams.toString()}`
      : API_ENDPOINTS.DEBTS.CLIENTS_SALE
    
    return apiService.get(endpoint)
  },

  getOldClientDebts: async (params?: { page?: number; search?: string }): Promise<ClientDebtsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.DEBTS.CLIENTS_OLD}?${queryParams.toString()}`
      : API_ENDPOINTS.DEBTS.CLIENTS_OLD
    
    return apiService.get(endpoint)
  },

  createOldSupplierDebt: async (data: CreateOldSupplierDebtRequest): Promise<void> => {
    await apiService.post(API_ENDPOINTS.DEBTS.CREATE_OLD_SUPPLIER, data)
  },

  createOldClientDebt: async (data: CreateOldClientDebtRequest): Promise<void> => {
    await apiService.post(API_ENDPOINTS.DEBTS.CREATE_OLD_CLIENT, data)
  },

  getSupplierOldDebtsDetail: async (supplierId: number, params?: { page?: number }): Promise<SupplierOldDebtsDetailResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    
    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.DEBTS.SUPPLIER_OLD_DEBTS_DETAIL(supplierId)}?${queryParams.toString()}`
      : API_ENDPOINTS.DEBTS.SUPPLIER_OLD_DEBTS_DETAIL(supplierId)
    
    return apiService.get(endpoint)
  },

  getClientOldDebtsDetail: async (clientId: number, params?: { page?: number }): Promise<ClientOldDebtsDetailResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    
    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.DEBTS.CLIENT_OLD_DEBTS_DETAIL(clientId)}?${queryParams.toString()}`
      : API_ENDPOINTS.DEBTS.CLIENT_OLD_DEBTS_DETAIL(clientId)
    
    return apiService.get(endpoint)
  },

  makeDirectOldDebtPayment: async (data: DirectOldDebtPaymentRequest): Promise<void> => {
    await apiService.post('/payments/old-client-debt-payments/direct-payment/', data)
  },

  makeDirectOldSupplierDebtPayment: async (data: DirectOldSupplierDebtPaymentRequest): Promise<void> => {
    await apiService.post('/payments/old-seller-debt-payments/direct-payment/', data)
  },

  getSupplierOldDebtPaymentHistory: async (oldDebtId: number, supplierId: number): Promise<SupplierOldDebtPaymentHistoryResponse> => {
    return apiService.get(`/payments/old-seller-debt-payments/supplier-payments/?old_debt_id=${oldDebtId}&supplier_id=${supplierId}`)
  },

  getClientOldDebtPaymentHistory: async (oldDebtId: number, clientId: number): Promise<ClientOldDebtPaymentHistoryResponse> => {
    return apiService.get(`/payments/old-client-debt-payments/client-payments/?old_debt_id=${oldDebtId}&client_id=${clientId}`)
  },

  getOldDebtsForCheque: async (clientId: number): Promise<OldDebtsForChequeResponse> => {
    return apiService.get(API_ENDPOINTS.DEBTS.FOR_CHEQUE(clientId))
  },
}
