/**
 * Transaction Form Dialog Component
 * Form for adding new expense or revenue transaction
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { getExchangeRate } from '@/lib/exchange-rate-storage'
import { BalanceService } from '@/services/balance.service'
import { CreateCategoryDialog } from './create-category-dialog'
import type { TransactionType, CreateBalanceTransactionData, Category, CategoryType, CreateCategoryData } from '@/types/balance'

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: TransactionType
  onSubmit: (data: CreateBalanceTransactionData) => Promise<void>
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  type,
  onSubmit,
}: TransactionFormDialogProps) {
  const { t } = useTranslation('kassa')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  const formSchema = z.object({
    amount: z.string().min(1, t('form.validation.amountRequired')),
    currency: z.enum(['UZS', 'USD']),
    exchange_rate: z.string().min(1, t('form.validation.exchangeRateRequired')),
    notes: z.string().min(1, t('form.validation.notesRequired')),
    category: z.string().optional(),
  })

  // Fetch categories
  const fetchCategories = async (search?: string) => {
    setIsLoadingCategories(true)
    try {
      const categoryType: CategoryType = type === 'expense' ? 'EXPENSE' : 'REVENUE'
      const data = await BalanceService.getCategories(search, categoryType)
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error(t('messages.error.fetchCategories'))
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Handle category creation
  const handleCreateCategory = async (data: CreateCategoryData) => {
    try {
      await BalanceService.createCategory(data)
      toast.success(t('messages.success.categoryCreated'))
      // Refresh categories list
      await fetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error(t('messages.error.createCategory'))
      throw error
    }
  }

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      currency: 'UZS',
      exchange_rate: getExchangeRate(),
      notes: '',
      category: '',
    },
  })

  // Update exchange rate and fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      form.setValue('exchange_rate', getExchangeRate())
      fetchCategories()
    }
  }, [open, form, type])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const submitData: CreateBalanceTransactionData = {
        amount: data.amount,
        currency: data.currency,
        exchange_rate: data.exchange_rate,
        notes: data.notes,
        category: data.category ? parseInt(data.category) : null,
      }
      await onSubmit(submitData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting transaction:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = type === 'expense' ? t('form.addExpense') : t('form.addRevenue')
  
  // Convert categories to combobox items
  const categoryItems = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('form.fields.amountPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.currency')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.fields.currencyPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UZS">UZS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.exchangeRate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('form.fields.exchangeRatePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.fields.notesPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.category')}</FormLabel>
                  <FormControl>
                    <Combobox
                      items={categoryItems}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('form.fields.categoryPlaceholder')}
                      searchPlaceholder={t('form.fields.categorySearchPlaceholder')}
                      emptyText={t('table.noData')}
                      disabled={isLoadingCategories}
                      showAddButton
                      onAddNew={() => setIsCategoryDialogOpen(true)}
                      addButtonLabel={t('form.addCategory')}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('form.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('form.buttons.save') + '...' : t('form.buttons.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        type={type === 'expense' ? 'EXPENSE' : 'REVENUE'}
        onSubmit={handleCreateCategory}
      />
    </Dialog>
  )
}
