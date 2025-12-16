/**
 * API Configuration
 * Centralized API configuration with base URL and endpoint paths
 */

// Get API base URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/**
 * API Endpoints
 * All backend API endpoints organized by domain
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/users/auth/login/',
    REFRESH_TOKEN: '/api/users/auth/token/refresh/',
    ME: '/api/users/auth/me/',
    ADD_USER: '/api/users/auth/add-user/',
    LIST_USERS: '/api/users/auth/list/',
    DISABLE_USER: (userId: number) => `/api/users/auth/disable-user/${userId}/`,
  },
  
  // Supplier endpoints
  SUPPLIERS: {
    LIST: '/api/users/suppliers/',
    DETAIL: (id: number) => `/api/users/suppliers/${id}/`,
    CREATE: '/api/users/suppliers/',
    UPDATE: (id: number) => `/api/users/suppliers/${id}/`,
    DELETE: (id: number) => `/api/users/suppliers/${id}/`,
    DEBTS: (id: number) => `/api/users/suppliers/${id}/debts/`,
  },
  
  // Client endpoints
  CLIENTS: {
    LIST: '/api/users/clients/',
    DETAIL: (id: number) => `/api/users/clients/${id}/`,
    CREATE: '/api/users/clients/',
    UPDATE: (id: number) => `/api/users/clients/${id}/`,
    DELETE: (id: number) => `/api/users/clients/${id}/`,
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
