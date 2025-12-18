/**
 * API Configuration
 * Centralized API configuration with base URL and endpoint paths
 */

// Get API base URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Media base URL for serving static files (with /api prefix for media endpoint)
export const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080/api'

/**
 * API Endpoints
 * All backend API endpoints organized by domain
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/users/auth/login/',
    REFRESH_TOKEN: '/users/auth/token/refresh/',
    ME: '/users/auth/me/',
    ADD_USER: '/users/auth/add-user/',
    LIST_USERS: '/users/auth/list/',
    DISABLE_USER: (userId: number) => `/users/auth/disable-user/${userId}/`,
  },
  
  // Supplier endpoints
  SUPPLIERS: {
    LIST: '/users/suppliers/',
    DETAIL: (id: number) => `/users/suppliers/${id}/`,
    CREATE: '/users/suppliers/',
    UPDATE: (id: number) => `/users/suppliers/${id}/`,
    DELETE: (id: number) => `/users/suppliers/${id}/`,
    DEBTS: (id: number) => `/users/suppliers/${id}/debts/`,
  },
  
  // Client endpoints
  CLIENTS: {
    LIST: '/users/clients/',
    DETAIL: (id: number) => `/users/clients/${id}/`,
    CREATE: '/users/clients/',
    UPDATE: (id: number) => `/users/clients/${id}/`,
    DELETE: (id: number) => `/users/clients/${id}/`,
  },
  
  // Product endpoints
  PRODUCTS: {
    BY_SUPPLIER: (supplierId: number) => `/products/suppliers/${supplierId}/products/`,
    DETAIL: (productId: number) => `/products/products/${productId}/`,
    BATCHES: (productId: number) => `/products/products/${productId}/batches/`,
  },
  
  // Debts endpoints
  DEBTS: {
    SUPPLIERS_NEW: '/debts/suppliers/new-debts/',
    SUPPLIERS_OLD: '/debts/suppliers/old-debts/',
    CLIENTS_SALE: '/debts/clients/sale-debts/',
    CLIENTS_OLD: '/debts/clients/old-debts/',
  },

  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD_METRICS: '/analytics/metrics/',
    LOW_STOCK: '/analytics/lists/low-stock/',
    SALES_PENDING: '/analytics/lists/sales-pending/',
    SALES_PARTIALLY_PAID: '/analytics/lists/sales-partially-paid/',
    SALES_FULLY_PAID: '/analytics/lists/sales-paid/',
  },

  // Sales endpoints
  SALES: {
    PRODUCTS_FOR_SALE: '/products/products/for-sale/',
    CREATE: '/sales/create/',
  },
} as const

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000

/**
 * Token storage keys
 */
export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const
