import { apiService } from './api.service'
import { API_ENDPOINTS } from '@/config/api'
import type { SupplierDebtsResponse, ClientDebtsResponse } from '@/types/debts'

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
}
