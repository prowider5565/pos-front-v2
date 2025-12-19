"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
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
import { debtsService } from "@/services/debts.service"
import { suppliersService } from "@/services/suppliers.service"

export default function SupplierOldDebtsDetailPage() {
  const { t } = useTranslation('debts')
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  // Fetch supplier info
  const { data: supplier } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => suppliersService.getSupplier(Number(supplierId)),
    enabled: !!supplierId,
  })

  // Fetch old debts for this supplier
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ['supplier-old-debts-detail', supplierId, page],
    queryFn: () => debtsService.getSupplierOldDebtsDetail(Number(supplierId), { page }),
    enabled: !!supplierId,
  })

  const formatAmount = (amount: string) => parseFloat(amount).toLocaleString()

  if (isLoading && !debtsData) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">{t('loading')}</div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout
      title={t('supplierOldDebtsDetail.title')}
      description={supplier ? `${supplier.full_name || supplier.company_name}` : ''}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/debts/suppliers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('supplierOldDebtsDetail.backToList')}
        </Button>
      }
    >
      <div className="space-y-6 p-6">
        {/* Supplier Info Card */}
        {supplier && (
          <Card>
            <CardHeader>
              <CardTitle>{t('supplierOldDebtsDetail.supplierInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('supplierOldDebtsDetail.fullName')}</p>
                  <p className="font-medium">{supplier.full_name}</p>
                </div>
                {supplier.company_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('supplierOldDebtsDetail.companyName')}</p>
                    <p className="font-medium">{supplier.company_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t('supplierOldDebtsDetail.phone')}</p>
                  <p className="font-medium">{supplier.phone_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {debtsData?.metadata && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">{t('supplierOldDebtsDetail.totalDebt')}</div>
                <div className="text-2xl font-bold">
                  {formatAmount(debtsData.metadata.total_debt.uzs_amount)} UZS
                </div>
                <div className="text-xs text-muted-foreground">
                  ${parseFloat(debtsData.metadata.total_debt.usd_amount).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">{t('supplierOldDebtsDetail.totalPaid')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatAmount(debtsData.metadata.total_paid.uzs_amount)} UZS
                </div>
                <div className="text-xs text-muted-foreground">
                  ${parseFloat(debtsData.metadata.total_paid.usd_amount).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">{t('supplierOldDebtsDetail.totalRemaining')}</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatAmount(debtsData.metadata.total_remaining.uzs_amount)} UZS
                </div>
                <div className="text-xs text-muted-foreground">
                  ${parseFloat(debtsData.metadata.total_remaining.usd_amount).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Old Debts Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('supplierOldDebtsDetail.oldDebtsList')}</CardTitle>
          </CardHeader>
          <CardContent>
            {debtsData && debtsData.results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('supplierOldDebtsDetail.debtId')}</TableHead>
                    <TableHead>{t('supplierOldDebtsDetail.status')}</TableHead>
                    <TableHead>{t('supplierOldDebtsDetail.currency')}</TableHead>
                    <TableHead className="text-right">{t('supplierOldDebtsDetail.originalAmount')}</TableHead>
                    <TableHead className="text-right">{t('supplierOldDebtsDetail.paidAmount')}</TableHead>
                    <TableHead className="text-right">{t('supplierOldDebtsDetail.remainingAmount')}</TableHead>
                    <TableHead className="text-right">{t('supplierOldDebtsDetail.exchangeRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtsData.results.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">#{debt.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(`status.${debt.status}`)}</Badge>
                      </TableCell>
                      <TableCell>{debt.currency}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatAmount(debt.debt_amounts.total_debt.uzs_amount)} UZS
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${parseFloat(debt.debt_amounts.total_debt.usd_amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-green-600">
                          {formatAmount(debt.debt_amounts.total_paid.uzs_amount)} UZS
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${parseFloat(debt.debt_amounts.total_paid.usd_amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${parseFloat(debt.debt_amounts.total_remaining.uzs_amount) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatAmount(debt.debt_amounts.total_remaining.uzs_amount)} UZS
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${parseFloat(debt.debt_amounts.total_remaining.usd_amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        1 USD = {formatAmount(debt.exchange_rate)} UZS
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t('supplierOldDebtsDetail.noDebts')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {debtsData && debtsData.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {debtsData.current_page} of {debtsData.total_pages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!debtsData.previous}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!debtsData.next}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
