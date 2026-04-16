"use client"

import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { paymentsService } from "@/services/payments.service"

const schema = z.object({
  amount: z.string().min(1, "Amount is required"),
  currency: z.enum(["UZS", "USD"]),
  method: z.enum(["CASH", "CARD", "TRANSFER"]),
})

type FormValues = z.infer<typeof schema>

interface ClientSalePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  saleDebts: Array<{
    id: number
    debt_amounts: {
      total_remaining: { uzs_amount: string; usd_amount: string }
    }
  }>
  onSuccess?: () => void
}

export function ClientSalePaymentDialog({
  open,
  onOpenChange,
  clientName,
  saleDebts,
  onSuccess
}: ClientSalePaymentDialogProps) {
  const { t } = useTranslation(['debts', 'common'])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", currency: "UZS", method: "CASH" },
  })

  const amount = useWatch({ control: form.control, name: "amount" })
  const currency = useWatch({ control: form.control, name: "currency" })

  // Calculate total remaining debt across all sales for this client
  const totalRemaining = useMemo(() => {
    return saleDebts.reduce((acc, debt) => ({
      uzs: acc.uzs + parseFloat(debt.debt_amounts.total_remaining.uzs_amount),
      usd: acc.usd + parseFloat(debt.debt_amounts.total_remaining.usd_amount)
    }), { uzs: 0, usd: 0 })
  }, [saleDebts])

  const remaining = useMemo(() => {
    const paid = parseFloat(amount) || 0
    if (currency === "UZS") {
      return { uzs: totalRemaining.uzs - paid, usd: totalRemaining.usd }
    }
    return { uzs: totalRemaining.uzs, usd: totalRemaining.usd - paid }
  }, [amount, currency, totalRemaining])

  const isOverpayment = remaining.uzs < 0 || remaining.usd < 0

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      let remainingAmount = parseFloat(data.amount)
      const paymentCurrency = data.currency

      // Iterate through sale debts and make payments
      for (const debt of saleDebts) {
        if (remainingAmount <= 0) break

        const debtRemaining = paymentCurrency === "UZS"
          ? parseFloat(debt.debt_amounts.total_remaining.uzs_amount)
          : parseFloat(debt.debt_amounts.total_remaining.usd_amount)

        if (debtRemaining <= 0) continue

        const paymentForThisDebt = Math.min(remainingAmount, debtRemaining)

        await paymentsService.saleDirectPayment({
          sale_id: debt.id,
          amount: paymentForThisDebt.toString(),
          currency: paymentCurrency,
          method: data.method,
        })

        remainingAmount -= paymentForThisDebt
      }

      toast.success(t('payment.success'))
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail
      toast.error(t('common:messages.error'), { description: detail || t('payment.failed') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('payment.title')}</DialogTitle>
          <DialogDescription>{t('payment.description', { name: clientName })}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payment.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payment.currency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger></FormControl>
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
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payment.method')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">{t('payment.methods.cash')}</SelectItem>
                        <SelectItem value="CARD">{t('payment.methods.card')}</SelectItem>
                        <SelectItem value="TRANSFER">{t('payment.methods.transfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payment.currentDebt')}:</span>
                <span className="font-medium">{totalRemaining.uzs.toLocaleString()} UZS / ${totalRemaining.usd.toLocaleString()}</span>
              </div>
              {!isOverpayment ? (
                <div className="flex justify-between text-primary font-semibold">
                  <span>{t('payment.remainingDebt')}:</span>
                  <span>{remaining.uzs.toLocaleString()} UZS / ${remaining.usd.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-red-500 font-semibold">
                  <span>{t('payment.overpayment')}:</span>
                  <span>+{Math.abs(remaining.uzs).toLocaleString()} UZS / +${Math.abs(remaining.usd).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="cursor-pointer">
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} className="cursor-pointer">
                {isLoading ? t('common:actions.saving') : t('payment.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}