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
import { suppliersService, type Supplier } from "@/services/suppliers.service"

const supplierFormSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  full_name: z.string().min(1, "Full name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
})

type SupplierFormValues = z.infer<typeof supplierFormSchema>

interface SupplierFormDialogProps {
  supplier?: Supplier
  onSuccess?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SupplierFormDialog({ supplier, onSuccess, trigger, open: controlledOpen, onOpenChange }: SupplierFormDialogProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!supplier
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      company_name: "",
      full_name: "",
      phone_number: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (isEditMode && supplier) {
        form.reset({
          company_name: supplier.company_name,
          full_name: supplier.full_name,
          phone_number: supplier.phone_number,
        })
      } else {
        form.reset({
          company_name: "",
          full_name: "",
          phone_number: "",
        })
      }
    }
  }, [open, supplier, isEditMode, form])

  const onSubmit = async (data: SupplierFormValues) => {
    setIsLoading(true)
    try {
      const payload = {
        company_name: data.company_name,
        full_name: data.full_name,
        phone_number: data.phone_number,
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

  const dialogContent = (
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
                  <Input placeholder={t('form.companyNamePlaceholder')} {...field} />
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
  )

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
