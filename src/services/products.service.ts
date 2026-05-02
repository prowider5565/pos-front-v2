import apiClient from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type { SaleProduct, SaleProductsResponse } from '@/types/sales'

// TypeScript interfaces
export interface ProductCategory {
  id: number
  name: string
  image?: string
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
  product_type: 'PIECE' | 'WEIGHT' | 'KG' | 'LITER'
  category: number
  category_name: string
  supplier_name: string
  barcode_number?: string | null
  images?: ProductImage[]
  sell_price?: number
  cover_image?: string
  quantity?: number
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

export interface BulkCreatedProductBatch {
  id: number
  product: {
    id: number
    name: string
    description: string | null
    barcode_number: string | null
    product_type: string
    category_name: string | null
    supplier_name: string
    images: ProductImage[]
    created_at: string
  }
  quantity: number
  buy_price: string
  sell_price: string
  created_at: string
}

export interface BulkCreateBatchesResponse {
  count: number
  results: BulkCreatedProductBatch[]
}

export interface ProductBatchesResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: ProductBatch[]
}

export interface Category {
  id: number
  name: string
  image?: string
  created_at: string
}

export interface CategoriesListResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: Category[]
}

export interface ImageUploadResponse {
  product_uuid: string
  images: {
    url: string
    is_main: boolean
  }[]
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

  async lookupProductByBarcode(barcode: string): Promise<SaleProduct> {
    const normalizedBarcode = barcode.trim()
    const response = await apiClient.get<SaleProductsResponse>(
      API_ENDPOINTS.PRODUCTS.BARCODE_LOOKUP(normalizedBarcode)
    )

    const product = response.data.results?.[0]
    if (!product) {
      const error = new Error(`No product found for barcode ${normalizedBarcode}`) as Error & {
        response?: { status: number }
      }
      error.response = { status: 404 }
      throw error
    }

    return {
      ...product,
      barcode: product.barcode ?? product.barcode_number ?? normalizedBarcode,
      barcode_number: product.barcode_number ?? product.barcode ?? normalizedBarcode,
    }
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

  /**
   * Update a product batch
   */
  async updateBatch(batchId: number, data: { sell_price: string }): Promise<ProductBatch> {
    const response = await apiClient.patch<ProductBatch>(
      `/products/batches/${batchId}/update/`,
      data
    )
    return response.data
  }

  /**
   * Create a new product batch
   */
  async createBatch(data: {
    product: number
    quantity: number
    buy_price: string
    sell_price: string
    finance?: {
      currency: 'UZS' | 'USD'
      exchange_rate: string
      amount?: string
      method?: string
    }
  }): Promise<ProductBatch> {
    const response = await apiClient.post<ProductBatch>(
      '/products/products/batches/create/',
      data
    )
    return response.data
  }

  async bulkCreateBatches(data: {
    batches: Array<{
      product: number
      quantity: number
      buy_price: string
      sell_price: string
      finance?: {
        currency: 'UZS' | 'USD'
        exchange_rate: string
        amount?: string | null
        method?: string | null
      }
    }>
  }): Promise<BulkCreateBatchesResponse> {
    const response = await apiClient.post<BulkCreateBatchesResponse>(
      '/products/products/batches/bulk-create/',
      data
    )
    return response.data
  }

  /**
   * Get categories list
   */
  async getCategories(): Promise<CategoriesListResponse> {
    const response = await apiClient.get<CategoriesListResponse>('/products/categories/')
    return response.data
  }

  /**
   * Upload category image
   */
  async uploadCategoryImage(categoryId: number, imageFile: File): Promise<{ image: string }> {
    const formData = new FormData()
    formData.append('category_id', categoryId.toString())
    formData.append('image', imageFile)
    
    const response = await apiClient.post<{ image: string }>(
      '/media/category-image/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  /**
   * Upload product images
   */
  async uploadImages(images: File[]): Promise<ImageUploadResponse> {
    const formData = new FormData()
    images.forEach((image) => {
      formData.append('images', image)
    })
    
    const response = await apiClient.post<ImageUploadResponse>(
      '/media/upload/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  /**
   * Create a new product
   */
  async createProduct(data: {
    name: string
    description?: string
    product_type: 'KG' | 'PIECE' | 'WEIGHT' | 'LITER'
    category: number
    supplier: number
    barcode_number?: string
    images?: { url: string; is_main: boolean }[]
    batch: {
      quantity: number
      buy_price: string
      sell_price: string
    }
    finance?: {
      currency: 'UZS' | 'USD'
      exchange_rate: string
      amount?: string
      method?: string
    }
    product_uuid?: string
  }): Promise<Product> {
    const response = await apiClient.post<Product>(
      '/products/products/create/',
      data
    )
    return response.data
  }

  /**
   * Update a product
   */
  async updateProduct(productId: number, data: {
    name?: string
    description?: string
    product_type?: 'KG' | 'PIECE' | 'WEIGHT' | 'LITER'
    category?: number
    barcode_number?: string
  }): Promise<Product> {
    const response = await apiClient.patch<Product>(
      `/products/products/${productId}/update/`,
      data
    )
    return response.data
  }
}

export const productsService = new ProductsService()
