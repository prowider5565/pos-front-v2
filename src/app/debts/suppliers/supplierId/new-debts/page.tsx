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
import { suppliersService } from "@/services/suppliers.service"
import { paymentsService } from "@/services/payments.service"
import { toast } from "sonner"
import type { ProductDebtDetail } from "@/types/debts"

export default function NewSupplierDebtDetailPage() {
  const { t } = useTranslation('debts')
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductDebtDetail | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentCurrency, setPaymentCurrency] = useState<"UZS" | "USD">("UZS")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH")
  
  // Payment history dialog
  const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<ProductDebtDetail | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch supplier info
  const { data: supplier } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => suppliersService.getSupplier(Number(supplierId)),
    enabled: !!supplierId,
  })

  // Fetch new debts for this supplier
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ['supplier-new-debts-detail', supplierId, page],
    queryFn: () => debtsService.getNewSupplierDebtDetail(Number(supplierId), { page }),
    enabled: !!supplierId,
  })

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data: { product_id: number; amount: string; currency: "UZS" | "USD"; method: "CASH" | "CARD" | "TRANSFER" }) => 
      paymentsService.makeNewSupplierDebtProductPayment(data),
    onSuccess: () => {
      toast.success(t('oldDebtPayment.success'))
      setPaymentDialogOpen(false)
      setSelectedProduct(null)
      setPaymentAmount("")
      queryClient.invalidateQueries({ queryKey: ['supplier-new-debts-detail', supplierId] })
      queryClient.invalidateQueries({ queryKey: ['debts', 'suppliers', 'new'] })
    },
    onError: (error: any) => {
      console.error('=== PAYMENT ERROR START ===')
      console.error('Full error:', error)
      console.error('Error data:', error.data)
      
      let errorMessage = t('oldDebtPayment.error')
      
      if (error.name === 'ApiException' && error.data) {
        const errorData = error.data
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else {
          errorMessage = JSON.stringify(errorData)
        }
      } else if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.error('Final error message:', errorMessage)
      console.error('=== PAYMENT ERROR END ===')
      
      toast.error(errorMessage)
    }
  })

  const handleMakePayment = (e: React.MouseEvent, product: ProductDebtDetail) => {
    e.stopPropagation()
    setSelectedProduct(product)
    setPaymentDialogOpen(true)
  }

  const handleRowClick = async (product: ProductDebtDetail) => {
    setSelectedProductForHistory(product)
    setPaymentHistoryDialogOpen(true)
    setLoadingHistory(true)
    try {
      const history = await paymentsService.getNewSupplierDebtProductPayments(product.product_id)
      setPaymentHistory(history)
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
      setPaymentHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmitPayment = () => {
    if (!selectedProduct || !paymentAmount) {
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

    // Validate that payment doesn't exceed remaining amount
    const remainingAmount = parseFloat(
      paymentCurrency === 'USD' 
        ? selectedProduct.debt_amounts.total_remaining.usd_amount 
        : selectedProduct.debt_amounts.total_remaining.uzs_amount
    )

    if (amount > remainingAmount) {
      toast.error(t('common:messages.error'), {
        description: `Payment amount cannot exceed remaining debt: ${formatCurrency(remainingAmount.toString(), paymentCurrency)}`
      })
      return
    }

    paymentMutation.mutate({
      product_id: selectedProduct.product_id,
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
      title={supplier ? `${supplier.full_name || supplier.company_name} - New Debts` : "Supplier New Debts"}
      description={supplier ? `Phone: ${supplier.phone_number}` : ""}
    >
      <div className="px-4 lg:px-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/debts/suppliers')}>
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
            <CardTitle>{t('tabs.newDebts')} List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.totalDebt')}</TableHead>
                  <TableHead>{t('table.totalPaid')}</TableHead>
                  <TableHead>{t('table.remaining')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : debtsData?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('table.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  debtsData?.results.map((product: ProductDebtDetail) => {
                    const remaining = parseFloat(product.debt_amounts.total_remaining.uzs_amount)
                    return (
                      <TableRow 
                        key={product.product_id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(product)}
                      >
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>{getStatusBadge(product.debt_status)}</TableCell>
                        <TableCell>
                          <div>
                            <div>{formatCurrency(product.debt_amounts.total_debt.uzs_amount, 'UZS')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(product.debt_amounts.total_debt.usd_amount, 'USD')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-green-600">{formatCurrency(product.debt_amounts.total_paid.uzs_amount, 'UZS')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(product.debt_amounts.total_paid.usd_amount, 'USD')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-orange-600 font-medium">{formatCurrency(product.debt_amounts.total_remaining.uzs_amount, 'UZS')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(product.debt_amounts.total_remaining.usd_amount, 'USD')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {remaining > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleMakePayment(e, product)}
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
                {t('oldDebtPayment.description', { debtId: selectedProduct?.product_name })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedProduct && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('oldDebtPayment.remainingAmount')}:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedProduct.debt_amounts.total_remaining.uzs_amount,
                        'UZS'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">USD:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedProduct.debt_amounts.total_remaining.usd_amount,
                        'USD'
                      )}
                    </span>
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
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {t('paymentHistory.title', { name: selectedProductForHistory?.product_name || '' })}
              </DialogTitle>
              <DialogDescription>
                {t('paymentHistory.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t('paymentHistory.amount')}</TableHead>
                    <TableHead>{t('paymentHistory.currency')}</TableHead>
                    <TableHead>{t('paymentHistory.method')}</TableHead>
                    <TableHead>{t('paymentHistory.exchangeRate')}</TableHead>
                    <TableHead>{t('paymentHistory.date')}</TableHead>
                    <TableHead>{t('paymentHistory.seller')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('paymentHistory.noPayments')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((payment, idx) => (
                      <TableRow key={payment.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.currency}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.method || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {parseFloat(payment.exchange_rate).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payment.seller_username}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPaymentHistoryDialogOpen(false)}>
                {t('common:actions.close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BaseLayout>
  )
}
