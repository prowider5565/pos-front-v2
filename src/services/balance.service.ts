/**
 * Balance Service
 * Handles API calls for revenue and expense transactions
 */

import apiClient from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type {
  BalanceListResponse,
  CreateBalanceTransactionData,
  BalanceTransaction,
  Category,
  CreateCategoryData,
  CategoryType,
} from '@/types/balance'

export class BalanceService {
  /**
   * Get list of expenses with pagination
   */
  static async getExpenses(page: number = 1): Promise<BalanceListResponse> {
    const response = await apiClient.get<BalanceListResponse>(
      API_ENDPOINTS.BALANCE.EXPENSES,
      {
        params: { page },
      }
    )
    return response.data
  }

  /**
   * Get list of revenues with pagination
   */
  static async getRevenues(page: number = 1): Promise<BalanceListResponse> {
    const response = await apiClient.get<BalanceListResponse>(
      API_ENDPOINTS.BALANCE.REVENUES,
      {
        params: { page },
      }
    )
    return response.data
  }

  /**
   * Create a new expense transaction
   */
  static async createExpense(
    data: CreateBalanceTransactionData
  ): Promise<BalanceTransaction> {
    const response = await apiClient.post<BalanceTransaction>(
      API_ENDPOINTS.BALANCE.CREATE_EXPENSE,
      data
    )
    return response.data
  }

  /**
   * Create a new revenue transaction
   */
  static async createRevenue(
    data: CreateBalanceTransactionData
  ): Promise<BalanceTransaction> {
    const response = await apiClient.post<BalanceTransaction>(
      API_ENDPOINTS.BALANCE.CREATE_REVENUE,
      data
    )
    return response.data
  }

  /**
   * Get categories with optional search
   */
  static async getCategories(search?: string, type?: CategoryType): Promise<Category[]> {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (type) params.type = type
    
    const response = await apiClient.get<Category[]>(
      API_ENDPOINTS.BALANCE.CATEGORIES,
      { params }
    )
    return response.data
  }

  /**
   * Create a new category
   */
  static async createCategory(data: CreateCategoryData): Promise<Category> {
    const response = await apiClient.post<Category>(
      API_ENDPOINTS.BALANCE.CREATE_CATEGORY,
      data
    )
    return response.data
  }
}
