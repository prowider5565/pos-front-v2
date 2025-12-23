/**
 * Authentication Type Definitions
 * Based on the backend Users API documentation
 */

/**
 * User model representing an authenticated user
 */
export interface User {
  id: number
  username: string
  phone_number: string
  first_name: string
  last_name: string
  is_superuser?: boolean
  is_active?: boolean
  deleted?: boolean
  telegram_id?: string
  telegram_username?: string
  telegram_first_name?: string
  telegram_photo_url?: string
}

/**
 * JWT authentication tokens
 */
export interface AuthTokens {
  access: string
  refresh: string
}

/**
 * Login request payload
 */
export interface LoginRequest {
  login: string // Can be username or phone_number
  password: string
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  user: User
  access: string
  refresh: string
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refresh: string
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  access: string
}

/**
 * Add user request (superuser only)
 */
export interface AddUserRequest {
  username: string
  password: string
  phone_number: string
  first_name?: string
  last_name?: string
}

/**
 * Add user response
 */
export interface AddUserResponse {
  message: string
  user: User
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  username?: string
  first_name?: string
  last_name?: string
  phone_number?: string
}

/**
 * Update profile response
 */
export interface UpdateProfileResponse {
  message: string
  user: User
}

/**
 * Authentication context state
 */
export interface AuthContextState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshUserData: () => Promise<void>
}

/**
 * API Error response structure
 */
export interface ApiError {
  detail?: string
  [key: string]: string | string[] | undefined
}

/**
 * Telegram generate link token response
 */
export interface TelegramGenerateLinkTokenResponse {
  token: string
  bot_username: string
}

/**
 * Telegram link status response
 */
export interface TelegramLinkStatusResponse {
  linked: boolean
  telegram_id?: string
  telegram_username?: string
  telegram_first_name?: string
}

/**
 * Telegram unlink response
 */
export interface TelegramUnlinkResponse {
  message: string
}

/**
 * Manual Telegram ID link request
 */
export interface TelegramManualLinkRequest {
  telegram_id: string
  telegram_username?: string
}

/**
 * Manual Telegram ID link response
 */
export interface TelegramManualLinkResponse {
  message: string
  user: User
}
