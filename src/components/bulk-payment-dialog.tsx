"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  paymentsService,
  type BulkPaymentPayload,
  type PaymentType,
} from "@/services/payments.service"

const paymentFormSchema = z.object({
  total_amount: z.string().min(1, "Amount is required"),
  currency: z.enum(["UZS", "USD"]),
  method: z.enum(["CASH", "CARD", "TRANSFER"]),
  distribution_strategy: z.enum(["oldest", "newest", "least_amount", "largest_amount"]),
})

type PaymentFormValues = z.infer<typeof paymentFormSchema>

interface BulkPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: PaymentType
  entityId: number
  entityName: string
  remainingUzs?: string
  remainingUsd?: string
  onSuccess?: () => void
}

export function BulkPaymentDialog({
  open,
  onOpenChange,
  type,
  entityId,
  entityName,
  remainingUzs,
  remainingUsd,
  onSuccess,
}: BulkPaymentDialogProps) {
  const { t } = useTranslation(['debts', 'common'])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      total_amount: "",
      currency: "UZS",
      method: "CASH",
      distribution_strategy: "oldest",
    },
  })

  const buildPayload = (data: PaymentFormValues): BulkPaymentPayload => ({
    payments: [{ total_amount: data.total_amount, currency: data.currency }],
    distribution_strategy: data.distribution_strategy,
    method: data.method,
    ...(type === 'old-client' ? { client_id: entityId } : { supplier_id: entityId }),
  })

  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true)
    try {
      const payload = buildPayload(data)

      await paymentsService.bulkPayment(type, payload)
      toast.success(t('payment.success'))
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Payment failed:", error)
      let errorMessage = t('payment.failed')
      
      if (error?.status === 400 || error?.response?.status === 400) {
        const detail = error?.data?.detail || error?.response?.data?.detail
        if (detail?.includes?.("oshib ketdi") || detail?.includes?.("exceeded")) {
          errorMessage = t('payment.exceededDebt')
        } else if (detail) {
          errorMessage = detail
        }
      }
      
      toast.error(t('common:messages.error'), { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const onTestPrintPayload = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error("Fill required fields first")
      return
    }

    const payload = buildPayload(form.getValues())
    const rustInvokePayload = { content: JSON.stringify(payload, null, 2) }

    console.log("Bulk payment payload:", payload)
    console.log("Rust print invoke payload (test):", rustInvokePayload)
    toast.success("Test payload logged to console")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('payment.title')}</DialogTitle>
          <DialogDescription>
            {t('payment.description', { name: entityName })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(remainingUzs !== undefined || remainingUsd !== undefined) && (
              <div className="space-y-2 rounded-lg bg-muted p-4">
                {remainingUzs !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('payment.remainingDebt')} (UZS):</span>
                    <span className="font-medium">{parseFloat(remainingUzs).toLocaleString()} UZS</span>
                  </div>
                )}
                {remainingUsd !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('payment.remainingDebt')} (USD):</span>
                    <span className="font-medium">${parseFloat(remainingUsd).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="total_amount"
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
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue />
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
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payment.method')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
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

            <FormField
              control={form.control}
              name="distribution_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payment.distributionStrategy')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="oldest">{t('payment.strategies.oldest')}</SelectItem>
                      <SelectItem value="newest">{t('payment.strategies.newest')}</SelectItem>
                      <SelectItem value="least_amount">{t('payment.strategies.leastAmount')}</SelectItem>
                      <SelectItem value="largest_amount">{t('payment.strategies.largestAmount')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onTestPrintPayload}
                disabled={isLoading}
                className="cursor-pointer"
              >
                Test Print Payload
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="cursor-pointer"
              >
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
