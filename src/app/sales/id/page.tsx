"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { ArrowLeft, Calendar, User, Phone, MapPin, FileText, Receipt } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { salesService } from "@/services/sales.service"

export default function SaleDetailPage() {
  const { t } = useTranslation('sales')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['sale-detail', id],
    queryFn: () => salesService.getSaleDetail(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">{t('loading')}</div>
        </div>
      </BaseLayout>
    )
  }

  if (error || !sale) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-destructive">
            {t('history.detail.loadError')}
          </div>
        </div>
      </BaseLayout>
    )
  }

  const formatAmount = (amount: string) => parseFloat(amount).toLocaleString()

  return (
    <BaseLayout
      title={t('history.detail.title', { id: sale.id })}
      description={format(new Date(sale.sale_date), 'PPpp')}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/sales')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('history.detail.backToList')}
        </Button>
      }
    >
      <div className="space-y-6 p-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('history.detail.summary')}</CardTitle>
              <Badge variant="outline">{t(`history.status.${sale.status}`)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('history.detail.clientInfo')}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{sale.client.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sale.client.phone_number}</span>
                  </div>
                  {sale.client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{sale.client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sale Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('history.detail.saleInfo')}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(sale.sale_date), 'PPpp')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {t('history.detail.exchangeRate')}: 1 USD = {formatAmount(sale.exchange_rate)} UZS
                    </span>
                  </div>
                  {sale.notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{sale.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('history.detail.financialSummary')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('history.columns.total')}</p>
                  <p className="font-semibold">{formatAmount(sale.debt_amounts.total_amount.uzs_amount)} UZS</p>
                  <p className="text-xs text-muted-foreground">${parseFloat(sale.debt_amounts.total_amount.usd_amount).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('history.columns.discount')}</p>
                  <p className="font-semibold">{formatAmount(sale.debt_amounts.discount_amount.uzs_amount)} UZS</p>
                  <p className="text-xs text-muted-foreground">${parseFloat(sale.debt_amounts.discount_amount.usd_amount).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('history.columns.afterDiscount')}</p>
                  <p className="font-semibold">{formatAmount(sale.debt_amounts.total_after_discount.uzs_amount)} UZS</p>
                  <p className="text-xs text-muted-foreground">${parseFloat(sale.debt_amounts.total_after_discount.usd_amount).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('history.columns.paid')}</p>
                  <p className="font-semibold text-green-600">{formatAmount(sale.debt_amounts.paid_amount.uzs_amount)} UZS</p>
                  <p className="text-xs text-muted-foreground">${parseFloat(sale.debt_amounts.paid_amount.usd_amount).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('history.columns.remaining')}</p>
                  <p className={`font-semibold ${parseFloat(sale.debt_amounts.remaining_amount.uzs_amount) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatAmount(sale.debt_amounts.remaining_amount.uzs_amount)} UZS
                  </p>
                  <p className="text-xs text-muted-foreground">${parseFloat(sale.debt_amounts.remaining_amount.usd_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items and Payments - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('history.detail.items')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('history.detail.product')}</TableHead>
                    <TableHead>{t('history.detail.type')}</TableHead>
                    <TableHead className="text-right">{t('history.detail.quantity')}</TableHead>
                    <TableHead className="text-right">{t('history.detail.subtotal')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                            {item.product.cover_image ? (
                              <img
                                src={`${import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080/api'}${item.product.cover_image}`}
                                alt={item.product.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(item.unit_price)} UZS
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.product.product_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right font-semibold">{formatAmount(item.subtotal)} UZS</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('history.detail.payments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {sale.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('history.detail.paymentMethod')}</TableHead>
                      <TableHead>{t('history.detail.currency')}</TableHead>
                      <TableHead className="text-right">{t('history.detail.amount')}</TableHead>
                      <TableHead>{t('history.detail.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant="outline">{t(`payment.methods.${payment.payment_method}`)}</Badge>
                        </TableCell>
                        <TableCell>{payment.currency}</TableCell>
                        <TableCell className="text-right font-medium">
                          <div>{formatAmount(payment.amount_display.uzs_amount)} UZS</div>
                          <div className="text-xs text-muted-foreground">
                            ${parseFloat(payment.amount_display.usd_amount).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{format(new Date(payment.created_at), 'PPpp')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {t('history.detail.noPayments')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseLayout>
  )
}
