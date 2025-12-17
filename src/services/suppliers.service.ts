import { apiService } from './api.service'

export interface SupplierOldDebt {
  amount: string
  exchange_rate: string
  currency: 'UZS' | 'USD'
}

export interface Supplier {
  id: number
  company_name: string
  full_name: string
  phone_number: string
  old_debt?: SupplierOldDebt
  is_active?: boolean
  created_at?: string
  updated_at?: string
  deleted?: boolean
  product_count?: number
}

export interface CreateSupplierPayload {
  company_name: string
  full_name: string
  phone_number: string
  old_debt?: SupplierOldDebt
}

export interface SuppliersListResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: Supplier[]
}

/**
 * Suppliers Service
 * Handles all supplier-related API operations
 */
export const suppliersService = {
  /**
   * List all suppliers with optional filtering
   * @param params - Query parameters (is_active, page, search)
   * @returns Promise with paginated supplier list
   */
  listSuppliers: async (params?: {
    is_active?: boolean
    page?: number
    search?: string
  }): Promise<SuppliersListResponse> => {
    const queryParams = new URLSearchParams()
    
    if (params?.is_active !== undefined) {
      queryParams.append('is_active', String(params.is_active))
    }
    if (params?.page) {
      queryParams.append('page', String(params.page))
    }
    if (params?.search) {
      queryParams.append('search', params.search)
    }
    
    const endpoint = queryParams.toString()
      ? `/users/suppliers/?${queryParams.toString()}`
      : '/users/suppliers/'
    
    return apiService.get(endpoint)
  },

  /**
   * Get a single supplier by ID
   * @param id - Supplier ID
   * @returns Promise with supplier details
   */
  getSupplier: async (id: number): Promise<Supplier> => {
    return apiService.get(`/users/suppliers/${id}/`)
  },

  /**
   * Create a new supplier
   * @param data - Supplier creation data
   * @returns Promise with created supplier
   */
  createSupplier: async (data: CreateSupplierPayload): Promise<Supplier> => {
    return apiService.post('/users/suppliers/', data)
  },

  /**
   * Update an existing supplier
   * @param id - Supplier ID
   * @param data - Supplier update data
   * @returns Promise with updated supplier
   */
  updateSupplier: async (id: number, data: Partial<CreateSupplierPayload>): Promise<Supplier> => {
    return apiService.patch(`/users/suppliers/${id}/`, data)
  },

  /**
   * Disable a supplier
   * @param id - Supplier ID
   * @returns Promise with void
   */
  disableSupplier: async (id: number): Promise<void> => {
    return apiService.patch(`/users/suppliers/${id}/disable/`)
  },

  /**
   * Enable a supplier
   * @param id - Supplier ID
   * @returns Promise with void
   */
  enableSupplier: async (id: number): Promise<void> => {
    return apiService.patch(`/users/suppliers/${id}/enable/`)
  },
}
