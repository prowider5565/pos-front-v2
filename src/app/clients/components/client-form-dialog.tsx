"use client"

import { useEffect, lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import 'react-phone-number-input/style.css'

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
import { clientsService, type Client } from "@/services/clients.service"

const clientFormSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
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
    },
  })

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
          full_name: client.full_name,
          phone_number: client.phone_number,
        })
      } else {
        form.reset({
          full_name: "",
          phone_number: "",
        })
      }
    }
  }, [open, client])

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const payload = {
        full_name: data.full_name,
        phone_number: data.phone_number,
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
