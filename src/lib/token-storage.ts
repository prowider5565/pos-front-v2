/**
 * Token Storage Utilities
 * Secure storage and retrieval of JWT tokens
 */

import { TOKEN_STORAGE_KEYS } from '@/config/api'

/**
 * Store access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, token)
  } catch (error) {
    console.error('Failed to store access token:', error)
  }
}

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
  } catch (error) {
    console.error('Failed to retrieve access token:', error)
    return null
  }
}

/**
 * Store refresh token in localStorage
 */
export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, token)
  } catch (error) {
    console.error('Failed to store refresh token:', error)
  }
}

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error)
    return null
  }
}

/**
 * Store both access and refresh tokens
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
}

/**
 * Clear all authentication tokens
 */
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
  } catch (error) {
    console.error('Failed to clear tokens:', error)
  }
}

/**
 * Check if user has valid tokens stored
 */
export const hasTokens = (): boolean => {
  return !!(getAccessToken() && getRefreshToken())
}
