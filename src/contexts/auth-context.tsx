/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/auth.service'
import { hasTokens, clearTokens } from '@/lib/token-storage'
import type { User, LoginRequest, AuthContextState } from '@/types/auth'
import { ApiException } from '@/services/api.service'

const AuthContext = createContext<AuthContextState | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods to the app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * Load user data from backend if tokens exist
   */
  const loadUser = useCallback(async () => {
    if (!hasTokens()) {
      setIsLoading(false)
      return
    }

    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to load user:', error)
      // If token is invalid, clear tokens
      if (error instanceof ApiException && error.status === 401) {
        clearTokens()
      }
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    loadUser()
  }, [loadUser])

  /**
   * Login user with credentials
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Logout user and clear state
   */
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  /**
   * Refresh user data from backend
   */
  const refreshUserData = async (): Promise<void> => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      throw error
    }
  }

  const value: AuthContextState = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
