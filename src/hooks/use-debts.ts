import { useQuery } from '@tanstack/react-query'
import { debtsService } from '@/services/debts.service'
import type { SupplierDebtsResponse, ClientDebtsResponse } from '@/types/debts'

export const useNewSupplierDebts = (page?: number, search?: string) => {
  return useQuery<SupplierDebtsResponse>({
    queryKey: ['debts', 'suppliers', 'new', page, search],
    queryFn: () => debtsService.getNewSupplierDebts({ page, search }),
    staleTime: 5 * 60 * 1000,
  })
}

export const useOldSupplierDebts = (page?: number, search?: string) => {
  return useQuery<SupplierDebtsResponse>({
    queryKey: ['debts', 'suppliers', 'old', page, search],
    queryFn: () => debtsService.getOldSupplierDebts({ page, search }),
    staleTime: 5 * 60 * 1000,
  })
}

export const useSaleClientDebts = (page?: number, search?: string) => {
  return useQuery<ClientDebtsResponse>({
    queryKey: ['debts', 'clients', 'sale', page, search],
    queryFn: () => debtsService.getSaleClientDebts({ page, search }),
    staleTime: 5 * 60 * 1000,
  })
}

export const useOldClientDebts = (page?: number, search?: string) => {
  return useQuery<ClientDebtsResponse>({
    queryKey: ['debts', 'clients', 'old', page, search],
    queryFn: () => debtsService.getOldClientDebts({ page, search }),
    staleTime: 5 * 60 * 1000,
  })
}
