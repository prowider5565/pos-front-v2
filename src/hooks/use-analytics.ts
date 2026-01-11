import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/analytics.service'
import type { AnalyticsDashboard, LowStockResponse, PendingSalesResponse, PartiallyPaidSalesResponse, FullyPaidSalesResponse } from '@/types/analytics'
import type { DateFilterParams } from '@/app/dashboard/components/dashboard-filter'

export const useAnalyticsDashboard = (filters?: DateFilterParams) => {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics', 'dashboard', filters],
    queryFn: () => analyticsService.getDashboardMetrics(filters),
    staleTime: 0, // Data is immediately stale, triggers background refetch
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })
}

export const useLowStockProducts = (filters?: DateFilterParams, page?: number) => {
  return useQuery<LowStockResponse>({
    queryKey: ['analytics', 'low-stock', filters, page],
    queryFn: () => analyticsService.getLowStockProducts(filters, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePendingSales = (filters?: DateFilterParams, page?: number) => {
  return useQuery<PendingSalesResponse>({
    queryKey: ['analytics', 'pending-sales', filters, page],
    queryFn: () => analyticsService.getPendingSales(filters, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePartiallyPaidSales = (filters?: DateFilterParams, page?: number) => {
  return useQuery<PartiallyPaidSalesResponse>({
    queryKey: ['analytics', 'partially-paid-sales', filters, page],
    queryFn: () => analyticsService.getPartiallyPaidSales(filters, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useFullyPaidSales = (filters?: DateFilterParams, page?: number) => {
  return useQuery<FullyPaidSalesResponse>({
    queryKey: ['analytics', 'fully-paid-sales', filters, page],
    queryFn: () => analyticsService.getFullyPaidSales(filters, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
