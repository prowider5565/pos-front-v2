"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft, CreditCard } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { debtsService } from "@/services/debts.service"
import { clientsService } from "@/services/clients.service"
import { toast } from "sonner"
import type { OldDebtItem, DirectOldDebtPaymentRequest } from "@/types/debts"

export default function ClientOldDebtsDetailPage() {
  const { t } = useTranslation('debts')
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<OldDebtItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentCurrency, setPaymentCurrency] = useState<"UZS" | "USD">("UZS")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH")

  // Fetch client info
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsService.getClient(Number(clientId)),
    enabled: !!clientId,
  })

  // Fetch old debts for this client
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ['client-old-debts-detail', clientId, page],
    queryFn: () => debtsService.getClientOldDebtsDetail(Number(clientId), { page }),
    enabled: !!clientId,
  })

  // Fetch payment history for selected debt
  const { data: paymentHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['client-old-debt-payments', selectedDebt?.id, clientId],
    queryFn: () => debtsService.getClientOldDebtPaymentHistory(selectedDebt!.id, Number(clientId)),
    enabled: !!selectedDebt && paymentHistoryDialogOpen && !!clientId,
  })

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data: DirectOldDebtPaymentRequest) => debtsService.makeDirectOldDebtPayment(data),
    onSuccess: () => {
      toast.success(t('oldDebtPayment.success'))
      setPaymentDialogOpen(false)
      setSelectedDebt(null)
      setPaymentAmount("")
      queryClient.invalidateQueries({ queryKey: ['client-old-debts-detail', clientId] })
      queryClient.invalidateQueries({ queryKey: ['debts', 'clients', 'old'] })
    },
    onError: (error: any) => {
      console.error('Payment error:', error)
      console.error('Error data:', error.data)
      console.error('Error name:', error.name)
      
      let errorMessage = t('oldDebtPayment.error')
      
      // ApiException has error data in the 'data' property
      if (error.name === 'ApiException' && error.data) {
        const errorData = error.data
        
        // Handle validation errors (like overpayment)
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else {
          // If we have any error data, try to stringify it
          errorMessage = JSON.stringify(errorData)
        }
      } else if (error.response?.data) {
        // Handle axios-style errors
        const errorData = error.response.data
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  })

  const handleMakePayment = (e: React.MouseEvent, debt: OldDebtItem) => {
    e.stopPropagation()
    setSelectedDebt(debt)
    setPaymentCurrency(debt.currency)
    setPaymentDialogOpen(true)
  }

  const handleRowClick = (debt: OldDebtItem) => {
    setSelectedDebt(debt)
    setPaymentHistoryDialogOpen(true)
  }

  const handleSubmitPayment = () => {
    if (!selectedDebt || !paymentAmount) {
      toast.error(t('common:messages.error'), {
        description: t('oldDebtPayment.amountRequired')
      })
      return
    }

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('common:messages.error'), {
        description: t('oldDebtPayment.invalidAmount')
      })
      return
    }

    paymentMutation.mutate({
      old_debt_id: selectedDebt.id,
      amount: paymentAmount,
      currency: paymentCurrency,
      method: paymentMethod
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge>{t('status.paid')}</Badge>
      case 'PARTIALLY_PAID':
        return <Badge>{t('status.partiallyPaid')}</Badge>
      case 'PENDING':
        return <Badge>{t('status.pending')}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    if (currency === 'UZS') {
      return `${num.toLocaleString()} UZS`
    } else {
      return `$${num.toLocaleString()}`
    }
  }

  return (
    <BaseLayout
      title={client ? `${client.full_name} - Old Debts` : "Client Old Debts"}
      description={client ? `Phone: ${client.phone_number}` : ""}
    >
      <div className="px-4 lg:px-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/debts/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('actions.back')}
        </Button>

        {/* Summary Cards */}
        {debtsData?.metadata && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('table.totalDebt')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(debtsData.metadata.total_debt.uzs_amount, 'UZS')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(debtsData.metadata.total_debt.usd_amount, 'USD')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('table.totalPaid')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(debtsData.metadata.total_paid.uzs_amount, 'UZS')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(debtsData.metadata.total_paid.usd_amount, 'USD')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('table.remaining')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(debtsData.metadata.total_remaining.uzs_amount, 'UZS')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(debtsData.metadata.total_remaining.usd_amount, 'USD')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Debts Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tabs.oldDebts')} List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>{t('table.totalDebt')}</TableHead>
                  <TableHead>{t('table.totalPaid')}</TableHead>
                  <TableHead>{t('table.remaining')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : debtsData?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t('table.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  debtsData?.results.map((debt) => {
                    const remaining = parseFloat(debt.debt_amounts.total_remaining[debt.currency === 'USD' ? 'usd_amount' : 'uzs_amount'])
                    return (
                      <TableRow 
                        key={debt.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(debt)}
                      >
                        <TableCell className="font-medium">#{debt.id}</TableCell>
                        <TableCell>{getStatusBadge(debt.status)}</TableCell>
                        <TableCell>{debt.currency}</TableCell>
                        <TableCell>{parseFloat(debt.exchange_rate).toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <div>{formatCurrency(debt.debt_amounts.total_debt.uzs_amount, 'UZS')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(debt.debt_amounts.total_debt.usd_amount, 'USD')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-green-600">{formatCurrency(debt.debt_amounts.total_paid.uzs_amount, 'UZS')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(debt.debt_amounts.total_paid.usd_amount, 'USD')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-orange-600 font-medium">{formatCurrency(debt.debt_amounts.total_remaining.uzs_amount, 'UZS')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(debt.debt_amounts.total_remaining.usd_amount, 'USD')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {remaining > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleMakePayment(e, debt)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              {t('actions.makePayment')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {debtsData && debtsData.count > 0 && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={debtsData.current_page}
                  totalCount={debtsData.count}
                  hasNext={!!debtsData.next}
                  hasPrevious={!!debtsData.previous}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('oldDebtPayment.title')}</DialogTitle>
              <DialogDescription>
                {t('oldDebtPayment.description', { debtId: selectedDebt?.id })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedDebt && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('oldDebtPayment.remainingAmount')}:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedDebt.debt_amounts.total_remaining[selectedDebt.currency === 'USD' ? 'usd_amount' : 'uzs_amount'],
                        selectedDebt.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('oldDebtPayment.exchangeRate')}:</span>
                    <span className="font-medium">{parseFloat(selectedDebt.exchange_rate).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">{t('oldDebtPayment.paymentAmount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder={t('oldDebtPayment.enterAmount')}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t('oldDebtPayment.currency')}</Label>
                <Select value={paymentCurrency} onValueChange={(v) => setPaymentCurrency(v as "UZS" | "USD")}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UZS">UZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">{t('oldDebtPayment.paymentMethod')}</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "CASH" | "CARD" | "TRANSFER")}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{t('oldDebtPayment.methods.cash')}</SelectItem>
                    <SelectItem value="CARD">{t('oldDebtPayment.methods.card')}</SelectItem>
                    <SelectItem value="TRANSFER">{t('oldDebtPayment.methods.transfer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                {t('oldDebtPayment.cancel')}
              </Button>
              <Button onClick={handleSubmitPayment} disabled={paymentMutation.isPending}>
                {paymentMutation.isPending ? t('oldDebtPayment.processing') : t('oldDebtPayment.makePayment')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={paymentHistoryDialogOpen} onOpenChange={setPaymentHistoryDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('paymentHistory.title', { debtId: selectedDebt?.id })}</DialogTitle>
              <DialogDescription>
                {paymentHistoryData?.client && (
                  <span>
                    {t('paymentHistory.clientInfo', {
                      name: paymentHistoryData.client.full_name,
                      phone: paymentHistoryData.client.phone_number
                    })}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-8">{t('paymentHistory.loading')}</div>
              ) : paymentHistoryData?.payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('paymentHistory.noPayments')}
                </div>
              ) : (
                <>
                  {paymentHistoryData && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{t('paymentHistory.totalPaid')}:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(paymentHistoryData.total_paid, selectedDebt?.currency || 'UZS')}
                        </span>
                      </div>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('paymentHistory.columns.id')}</TableHead>
                        <TableHead>{t('paymentHistory.columns.amountUzs')}</TableHead>
                        <TableHead>{t('paymentHistory.columns.amountUsd')}</TableHead>
                        <TableHead>{t('paymentHistory.columns.currency')}</TableHead>
                        <TableHead>{t('paymentHistory.columns.exchangeRate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistoryData?.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">#{payment.id}</TableCell>
                          <TableCell>
                            {formatCurrency(payment.amount_display.uzs_amount, 'UZS')}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payment.amount_display.usd_amount, 'USD')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.currency}</Badge>
                          </TableCell>
                          <TableCell>
                            {parseFloat(payment.exchange_rate).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPaymentHistoryDialogOpen(false)}>
                {t('paymentHistory.close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BaseLayout>
  )
}
