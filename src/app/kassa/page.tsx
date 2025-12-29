/**
 * Kassa (Cash Register) Page
 * Displays expenses and revenue transactions with tab-based interface
 */

import { useState, useEffect } from 'react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DataTable } from './components/data-table'
import { SummaryCards } from './components/summary-cards'
import { TransactionFormDialog } from './components/transaction-form-dialog'
import { BalanceService } from '@/services/balance.service'
import type { BalanceTransaction, TransactionType, CreateBalanceTransactionData } from '@/types/balance'
import { toast } from 'sonner'
import { formatVerboseDate } from '@/lib/date-utils'
import { useLanguage } from '@/hooks/use-language'
import { Pencil, Trash2 } from 'lucide-react'

export default function KassaPage() {
  const { t } = useTranslation('kassa')
  const { currentLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState<TransactionType>('expense')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Expenses state
  const [expenses, setExpenses] = useState<BalanceTransaction[]>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [expensesError, setExpensesError] = useState<Error | null>(null)
  const [expensesPage, setExpensesPage] = useState(1)
  const [expensesTotalUzs, setExpensesTotalUzs] = useState('0.00')
  const [expensesTotalUsd, setExpensesTotalUsd] = useState('0.00')
  const [expensesTotalCount, setExpensesTotalCount] = useState(0)
  const [expensesTotalPages, setExpensesTotalPages] = useState(0)

  // Revenue state
  const [revenues, setRevenues] = useState<BalanceTransaction[]>([])
  const [revenuesLoading, setRevenuesLoading] = useState(false)
  const [revenuesError, setRevenuesError] = useState<Error | null>(null)
  const [revenuesPage, setRevenuesPage] = useState(1)
  const [revenuesTotalUzs, setRevenuesTotalUzs] = useState('0.00')
  const [revenuesTotalUsd, setRevenuesTotalUsd] = useState('0.00')
  const [revenuesTotalCount, setRevenuesTotalCount] = useState(0)
  const [revenuesTotalPages, setRevenuesTotalPages] = useState(0)

  // Fetch expenses
  const fetchExpenses = async (page: number = 1) => {
    setExpensesLoading(true)
    setExpensesError(null)
    try {
      const response = await BalanceService.getExpenses(page)
      setExpenses(response.results)
      setExpensesTotalUzs(response.metadata.total_expense?.uzs || '0.00')
      setExpensesTotalUsd(response.metadata.total_expense?.usd || '0.00')
      setExpensesTotalCount(response.count)
      setExpensesTotalPages(response.total_pages)
      setExpensesPage(page)
    } catch (error) {
      setExpensesError(error as Error)
      toast.error(t('messages.error.fetchExpenses'))
    } finally {
      setExpensesLoading(false)
    }
  }

  // Fetch revenues
  const fetchRevenues = async (page: number = 1) => {
    setRevenuesLoading(true)
    setRevenuesError(null)
    try {
      const response = await BalanceService.getRevenues(page)
      setRevenues(response.results)
      setRevenuesTotalUzs(response.metadata.total_revenue?.uzs || '0.00')
      setRevenuesTotalUsd(response.metadata.total_revenue?.usd || '0.00')
      setRevenuesTotalCount(response.count)
      setRevenuesTotalPages(response.total_pages)
      setRevenuesPage(page)
    } catch (error) {
      setRevenuesError(error as Error)
      toast.error(t('messages.error.fetchRevenue'))
    } finally {
      setRevenuesLoading(false)
    }
  }

  // Load data on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'expense') {
      fetchExpenses(expensesPage)
    } else {
      fetchRevenues(revenuesPage)
    }
  }, [activeTab])

  // Handle form submission
  const handleSubmit = async (data: CreateBalanceTransactionData) => {
    try {
      if (activeTab === 'expense') {
        await BalanceService.createExpense(data)
        toast.success(t('messages.success.expenseCreated'))
        fetchExpenses(expensesPage)
      } else {
        await BalanceService.createRevenue(data)
        toast.success(t('messages.success.revenueCreated'))
        fetchRevenues(revenuesPage)
      }
    } catch (error) {
      const errorMessage = activeTab === 'expense'
        ? t('messages.error.createExpense')
        : t('messages.error.createRevenue')
      toast.error(errorMessage)
      throw error
    }
  }

  // Handle delete transaction
  const handleDelete = async (id: number) => {
    // TODO: Implement delete functionality when API is ready
    console.log('Delete transaction:', id)
    toast.info('Delete functionality coming soon')
  }

  // Handle edit transaction
  const handleEdit = (transaction: BalanceTransaction) => {
    // TODO: Implement edit functionality when API is ready
    console.log('Edit transaction:', transaction)
    toast.info('Edit functionality coming soon')
  }

  // Define table columns
  const columns: ColumnDef<BalanceTransaction>[] = React.useMemo(() => [
    {
      accessorKey: 'created_at',
      header: () => t('table.columns.date'),
      cell: ({ row }) => {
        return formatVerboseDate(row.original.created_at, currentLanguage)
      },
    },
    {
      accessorKey: 'amount',
      header: () => t('table.columns.amount'),
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount)
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.original.currency}`
      },
    },
    {
      accessorKey: 'exchange_rate',
      header: () => t('table.columns.exchangeRate'),
      cell: ({ row }) => {
        const rate = parseFloat(row.original.exchange_rate)
        return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      },
    },
    {
      accessorKey: 'notes',
      header: () => t('table.columns.notes'),
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.original.notes}>
          {row.original.notes}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: () => t('table.columns.category'),
      cell: ({ row }) => row.original.category || '-',
    },
    {
      accessorKey: 'created_by_name',
      header: () => t('table.columns.createdBy'),
    },
    {
      id: 'actions',
      header: () => t('table.columns.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            title={t('form.editExpense')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            title={t('table.columns.actions')}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [t, currentLanguage, handleEdit, handleDelete])

  return (
    <BaseLayout
      title={t('title')}
      actions={
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === 'expense' ? t('form.addExpense') : t('form.addRevenue')}
        </Button>
      }
    >
      <div className="@container/main px-4 lg:px-6 space-y-6">
        {/* Summary Cards - Always visible */}
        <SummaryCards
          totalUzs={activeTab === 'expense' ? expensesTotalUzs : revenuesTotalUzs}
          totalUsd={activeTab === 'expense' ? expensesTotalUsd : revenuesTotalUsd}
          type={activeTab}
        />

        {/* Tabs - Full width */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TransactionType)} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="expense">{t('tabs.expenses')}</TabsTrigger>
            <TabsTrigger value="revenue">{t('tabs.revenue')}</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expense" className="mt-6">
            <DataTable
              columns={columns}
              data={expenses}
              isLoading={expensesLoading}
              error={expensesError}
              pagination={{
                currentPage: expensesPage,
                totalCount: expensesTotalCount,
                totalPages: expensesTotalPages,
                onPageChange: fetchExpenses,
              }}
            />
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-6">
            <DataTable
              columns={columns}
              data={revenues}
              isLoading={revenuesLoading}
              error={revenuesError}
              pagination={{
                currentPage: revenuesPage,
                totalCount: revenuesTotalCount,
                totalPages: revenuesTotalPages,
                onPageChange: fetchRevenues,
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Add Transaction Dialog */}
        <TransactionFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          type={activeTab}
          onSubmit={handleSubmit}
        />
      </div>
    </BaseLayout>
  )
}
