import apiClient from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export interface ClientOldDebt {
  client: number
  amount: string
  exchange_rate: string
  currency: 'UZS' | 'USD'
}

export interface Client {
  id: number
  full_name: string
  phone_number: string
  old_debt?: ClientOldDebt | null
  created_at: string
  updated_at: string
}

export interface CreateClientData {
  full_name: string
  phone_number: string
  old_debt?: {
    amount: string
    exchange_rate: string
    currency: 'UZS' | 'USD'
  }
}

export interface UpdateClientData {
  full_name?: string
  phone_number?: string
  old_debt?: {
    amount: string
    exchange_rate: string
    currency: 'UZS' | 'USD'
  }
}

export interface ClientsListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Client[]
}

class ClientsService {
  /**
   * Get list of clients with pagination
   */
  async getClients(page: number = 1, pageSize: number = 10): Promise<ClientsListResponse> {
    const response = await apiClient.get<ClientsListResponse>(API_ENDPOINTS.CLIENTS.LIST, {
      params: {
        page,
        page_size: pageSize,
      },
    })
    return response.data
  }

  /**
   * Get a single client by ID
   */
  async getClient(id: number): Promise<Client> {
    const response = await apiClient.get<Client>(API_ENDPOINTS.CLIENTS.DETAIL(id))
    return response.data
  }

  /**
   * Create a new client
   */
  async createClient(data: CreateClientData): Promise<Client> {
    const response = await apiClient.post<Client>(API_ENDPOINTS.CLIENTS.CREATE, data)
    return response.data
  }

  /**
   * Update an existing client
   */
  async updateClient(id: number, data: UpdateClientData): Promise<Client> {
    const response = await apiClient.patch<Client>(API_ENDPOINTS.CLIENTS.UPDATE(id), data)
    return response.data
  }

  /**
   * Delete a client
   */
  async deleteClient(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CLIENTS.DELETE(id))
  }
}

export const clientsService = new ClientsService()
