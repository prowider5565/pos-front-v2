"use client"

import { useEffect, lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import 'react-phone-number-input/style.css'

// Lazy-load PhoneInput to reduce initial bundle size (Vite/React.lazy)
const PhoneInput = lazy(() => import('react-phone-number-input'))

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { clientsService, type Client } from "@/services/clients.service"
import { getExchangeRate } from "@/lib/exchange-rate-storage"

const clientFormSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  has_old_debt: z.boolean().default(false),
  old_debt_amount: z.string().optional(),
  old_debt_exchange_rate: z.string().optional(),
  old_debt_currency: z.enum(["UZS", "USD"]).optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess: () => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const { t } = useTranslation(['clients', 'common'])

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      has_old_debt: false,
      old_debt_amount: "",
      old_debt_exchange_rate: getExchangeRate(),
      old_debt_currency: "UZS",
    },
  })

  // Use useWatch instead of form.watch to avoid re-render storms
  const hasOldDebt = useWatch({
    control: form.control,
    name: "has_old_debt",
    defaultValue: false,
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (client) {
        // Edit mode - populate with client data
        form.reset({
          full_name: client.full_name,
          phone_number: client.phone_number,
          has_old_debt: !!client.old_debt,
          old_debt_amount: client.old_debt?.amount || "",
          old_debt_exchange_rate: client.old_debt?.exchange_rate || getExchangeRate(),
          old_debt_currency: client.old_debt?.currency || "UZS",
        })
      } else {
        // Create mode - reset to defaults
        form.reset({
          full_name: "",
          phone_number: "",
          has_old_debt: false,
          old_debt_amount: "",
          old_debt_exchange_rate: getExchangeRate(),
          old_debt_currency: "UZS",
        })
      }
    }
  }, [open, client])

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const payload: any = {
        full_name: data.full_name,
        phone_number: data.phone_number,
      }

      // Only include old_debt if checkbox is checked and amount is provided
      if (data.has_old_debt && data.old_debt_amount && parseFloat(data.old_debt_amount) > 0) {
        payload.old_debt = {
          amount: data.old_debt_amount,
          exchange_rate: data.old_debt_exchange_rate || "1",
          currency: data.old_debt_currency || "UZS",
        }
      }

      if (client) {
        await clientsService.updateClient(client.id, payload)
        toast.success(t('messages.clientUpdated'))
      } else {
        await clientsService.createClient(payload)
        toast.success(t('messages.clientCreated'))
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to save client:", error)
      toast.error(t('common:messages.error'), {
        description: client ? "Failed to update client" : "Failed to create client"
      })
    }
  }

  // Only render dialog when open to free memory when closed
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? t('editClient') : t('addClient')}
          </DialogTitle>
          <DialogDescription>
            {client ? t('editClientDescription') : t('addClientDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fullName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.fullNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-muted" />}>
                      <PhoneInput
                        international
                        defaultCountry="UZ"
                        value={field.value}
                        onChange={field.onChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </Suspense>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_old_debt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('form.hasOldDebt')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {hasOldDebt && (
              <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                <h4 className="text-sm font-medium">{t('form.oldDebtDetails')}</h4>
                
                <FormField
                  control={form.control}
                  name="old_debt_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.amount')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder={t('form.amountPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="old_debt_currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.currency')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder={t('form.currencyPlaceholder')} />
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
                  name="old_debt_exchange_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.exchangeRate')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder={t('form.exchangeRatePlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
                className="cursor-pointer"
              >
                {t('common:actions.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting} 
                className="cursor-pointer"
              >
                {form.formState.isSubmitting ? t('common:actions.saving') : t('common:actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
