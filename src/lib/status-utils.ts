/**
 * Get translation key for sale status
 */
export function getStatusTranslationKey(status: string): string {
  const statusMap: Record<string, string> = {
    'PAID': 'status.PAID',
    'PENDING': 'status.PENDING',
    'PARTIALLY_PAID': 'status.PARTIALLY_PAID',
  }
  
  return statusMap[status] || status
}

/**
 * Get badge variant for sale status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'PAID':
      return 'default'
    case 'PARTIALLY_PAID':
      return 'secondary'
    case 'PENDING':
      return 'outline'
    default:
      return 'outline'
  }
}
