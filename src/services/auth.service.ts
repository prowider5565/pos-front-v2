/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { API_ENDPOINTS } from '@/config/api'
import { apiService } from './api.service'
import { setTokens, clearTokens } from '@/lib/token-storage'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  AddUserRequest,
  AddUserResponse,
} from '@/types/auth'

/**
 * Authentication service methods
 */
export const authService = {
  /**
   * Login user with username/phone and password
   * @param credentials - Login credentials (username or phone + password)
   * @returns Promise with user data and tokens
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiService.publicPost<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )
    
    // Store tokens after successful login
    setTokens(response.access, response.refresh)
    
    return response
  },

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token
   * @returns Promise with new access token
   */
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const request: RefreshTokenRequest = { refresh: refreshToken }
    return apiService.publicPost<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      request
    )
  },

  /**
   * Get current authenticated user profile
   * @returns Promise with user data
   */
  getCurrentUser: async (): Promise<User> => {
    return apiService.get<User>(API_ENDPOINTS.AUTH.ME)
  },

  /**
   * Logout user (clear tokens)
   */
  logout: (): void => {
    clearTokens()
  },

  /**
   * Add a new user (superuser only)
   * @param userData - New user data
   * @returns Promise with created user data
   */
  addUser: async (userData: AddUserRequest): Promise<AddUserResponse> => {
    return apiService.post<AddUserResponse>(
      API_ENDPOINTS.AUTH.ADD_USER,
      userData
    )
  },

  /**
   * List all users with optional filtering (superuser only)
   * @param params - Query parameters (is_active, page, search)
   * @returns Promise with paginated user list
   */
  listUsers: async (params?: {
    is_active?: boolean
    page?: number
    search?: string
  }): Promise<{
    count: number
    current_page: number
    next: string | null
    previous: string | null
    total_pages: number
    results: User[]
  }> => {
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
      ? `${API_ENDPOINTS.AUTH.LIST_USERS}?${queryParams.toString()}`
      : API_ENDPOINTS.AUTH.LIST_USERS
    
    return apiService.get(endpoint)
  },

  /**
   * Disable a user account (superuser only)
   * @param userId - ID of the user to disable
   * @returns Promise with success message
   */
  disableUser: async (userId: number): Promise<{ detail: string }> => {
    return apiService.post(API_ENDPOINTS.AUTH.DISABLE_USER(userId))
  },
}
