import apiClient from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type { 
  SaleProductsResponse, 
  CreateSaleRequest, 
  CreateSaleResponse 
} from '@/types/sales'

/**
 * Sales Service
 * Handles all sales-related API operations
 */
class SalesService {
  /**
   * Get products available for sale with pagination and filtering
   */
  async getProductsForSale(params?: {
    page?: number
    page_size?: number
    search?: string
    category?: number
  }): Promise<SaleProductsResponse> {
    const response = await apiClient.get<SaleProductsResponse>(
      API_ENDPOINTS.SALES.PRODUCTS_FOR_SALE,
      { params }
    )
    return response.data
  }

  /**
   * Create a new sale transaction
   */
  async createSale(saleData: CreateSaleRequest): Promise<CreateSaleResponse> {
    const response = await apiClient.post<CreateSaleResponse>(
      API_ENDPOINTS.SALES.CREATE,
      saleData
    )
    return response.data
  }
}

export const salesService = new SalesService()
