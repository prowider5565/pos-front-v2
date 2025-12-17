import apiClient from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

// TypeScript interfaces
export interface ProductCategory {
  id: number
  name: string
}

export interface ProductImage {
  id: number
  url: string
  is_main: boolean
}

export interface Product {
  id: number
  name: string
  description: string | null
  product_type: 'PIECE' | 'WEIGHT'
  category: ProductCategory
  images: ProductImage[]
  sell_price: number
  cover_image: string
  quantity: number
  created_at: string
}

export interface SupplierInfo {
  id: number
  full_name: string
  company_name: string
  phone_number: string
}

export interface ProductsListResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: Product[]
  supplier: SupplierInfo
}

export interface ProductBatch {
  id: number
  product: number
  quantity: number
  buy_price: string
  sell_price: string
  created_at: string
}

export interface ProductBatchesResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: ProductBatch[]
}

class ProductsService {
  /**
   * Get products filtered by supplier
   */
  async getProductsBySupplier(supplierId: number, page: number = 1, search?: string): Promise<ProductsListResponse> {
    const params: { page: number; search?: string } = { page }
    if (search && search.trim()) {
      params.search = search.trim()
    }
    
    const response = await apiClient.get<ProductsListResponse>(
      API_ENDPOINTS.PRODUCTS.BY_SUPPLIER(supplierId),
      {
        params,
      }
    )
    return response.data
  }

  /**
   * Get product details
   */
  async getProductDetail(productId: number): Promise<Product> {
    const response = await apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.DETAIL(productId))
    return response.data
  }

  /**
   * Get product batches
   */
  async getProductBatches(productId: number, page: number = 1): Promise<ProductBatchesResponse> {
    const response = await apiClient.get<ProductBatchesResponse>(
      API_ENDPOINTS.PRODUCTS.BATCHES(productId),
      {
        params: {
          page,
        },
      }
    )
    return response.data
  }
}

export const productsService = new ProductsService()
