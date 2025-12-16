import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token-storage'
import { API_BASE_URL } from '@/config/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor - inject access token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Attempt to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })

        const { access, refresh } = response.data
        setTokens(access, refresh)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        clearTokens()
        window.location.href = '/auth/sign-in'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Typed API wrapper functions
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config)
    return response.data
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config)
    return response.data
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config)
    return response.data
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config)
    return response.data
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config)
    return response.data
  },
}

export default apiClient
