"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { suppliersService, type Supplier } from "@/services/suppliers.service"

const supplierFormSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  full_name: z.string().min(1, "Full name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  old_debt_amount: z.string().optional(),
  old_debt_exchange_rate: z.string().optional(),
  old_debt_currency: z.enum(["UZS", "USD"]),
})

type SupplierFormValues = z.infer<typeof supplierFormSchema>

interface SupplierFormDialogProps {
  supplier?: Supplier
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function SupplierFormDialog({ supplier, onSuccess, trigger }: SupplierFormDialogProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!supplier

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      company_name: "",
      full_name: "",
      phone_number: "",
      old_debt_amount: "",
      old_debt_exchange_rate: "",
      old_debt_currency: "UZS",
    },
  })

  // Reset form when supplier prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (isEditMode && supplier) {
        form.reset({
          company_name: supplier.company_name,
          full_name: supplier.full_name,
          phone_number: supplier.phone_number,
          old_debt_amount: supplier.old_debt?.amount || "",
          old_debt_exchange_rate: supplier.old_debt?.exchange_rate || "",
          old_debt_currency: supplier.old_debt?.currency || "UZS",
        })
      } else {
        form.reset({
          company_name: "",
          full_name: "",
          phone_number: "",
          old_debt_amount: "",
          old_debt_exchange_rate: "",
          old_debt_currency: "UZS",
        })
      }
    }
  }, [open, supplier, isEditMode, form])

  const onSubmit = async (data: SupplierFormValues) => {
    setIsLoading(true)
    try {
      const payload: any = {
        company_name: data.company_name,
        full_name: data.full_name,
        phone_number: data.phone_number,
      }

      // Only include old_debt if amount is provided
      if (data.old_debt_amount && data.old_debt_amount.trim() !== "") {
        payload.old_debt = {
          amount: data.old_debt_amount,
          exchange_rate: data.old_debt_exchange_rate || "1",
          currency: data.old_debt_currency,
        }
      }

      if (isEditMode && supplier) {
        await suppliersService.updateSupplier(supplier.id, payload)
        toast.success(t('messages.supplierUpdated'))
      } else {
        await suppliersService.createSupplier(payload)
        toast.success(t('messages.supplierCreated'))
      }
      
      setOpen(false)
      form.reset()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} supplier:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} supplier`
      toast.error(t('common:messages.error'), {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="cursor-pointer">
      <Plus className="mr-2 size-4" />
      {t('addSupplier')}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editSupplier') : t('addSupplier')}</DialogTitle>
          <DialogDescription>
            {t('subtitle')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.companyName')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('form.companyNamePlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fullName')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('form.fullNamePlaceholder')} 
                      {...field} 
                    />
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
                    <PhoneInput
                      international
                      defaultCountry="UZ"
                      value={field.value}
                      onChange={field.onChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium">{t('form.oldDebt')} (Optional)</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder={t('form.currency')} />
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
              </div>

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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} className="cursor-pointer">
                {isLoading ? t('common:actions.saving') : t('common:actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
