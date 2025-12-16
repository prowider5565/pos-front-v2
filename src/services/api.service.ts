/**
 * Base API Service
 * Handles HTTP requests with automatic JWT token injection and refresh
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/config/api'
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '@/lib/token-storage'
import type { ApiError } from '@/types/auth'

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  public status: number
  public data: ApiError

  constructor(
    status: number,
    data: ApiError,
    message?: string
  ) {
    super(message || 'API request failed')
    this.name = 'ApiException'
    this.status = status
    this.data = data
  }
}

/**
 * Make an API request with automatic token injection
 */
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = getAccessToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authorization header if token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  const url = `${API_BASE_URL}${endpoint}`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiException(408, { detail: 'Request timeout' })
    }
    throw error
  }
}

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (response.ok) {
      const data = await response.json()
      setAccessToken(data.access)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

/**
 * Process API response and handle errors
 */
async function processResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    const errorData: ApiError = isJson 
      ? await response.json() 
      : { detail: response.statusText }
    
    throw new ApiException(response.status, errorData)
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T
  }

  if (isJson) {
    return response.json()
  }
  
  return response.text() as unknown as T
}

/**
 * Make an API request with automatic retry on 401
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  try {
    const response = await fetchWithAuth(endpoint, options)
    return await processResponse<T>(response)
  } catch (error) {
    // If we get a 401 and haven't retried yet, try to refresh token
    if (error instanceof ApiException && error.status === 401 && retry) {
      const refreshed = await refreshAccessToken()
      
      if (refreshed) {
        // Retry the request with new token
        return apiRequest<T>(endpoint, options, false)
      } else {
        // Refresh failed, clear tokens and redirect to login
        clearTokens()
        window.location.href = '/auth/sign-in'
        throw error
      }
    }
    
    throw error
  }
}

/**
 * API Service methods
 */
export const apiService = {
  /**
   * GET request
   */
  get: <T>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'GET' })
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'DELETE' })
  },

  /**
   * Request without authentication (for public endpoints)
   */
  publicPost: <T>(endpoint: string, data?: unknown): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    }).then(processResponse<T>)
  },
}
