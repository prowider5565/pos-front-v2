"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { debtsService } from "@/services/debts.service"
import { suppliersService } from "@/services/suppliers.service"
import { clientsService } from "@/services/clients.service"
import { getExchangeRateNumber } from "@/lib/exchange-rate-storage"

const addOldDebtSchema = z.object({
  entity_id: z.string().min(1, "Please select a supplier or client"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Amount must be greater than 0"),
  currency: z.enum(["UZS", "USD"]),
  exchange_rate: z.string().min(1, "Exchange rate is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Exchange rate must be greater than 0"),
})

type AddOldDebtFormValues = z.infer<typeof addOldDebtSchema>

interface AddOldDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: "supplier" | "client"
  onSuccess: () => void
}

export function AddOldDebtDialog({
  open,
  onOpenChange,
  entityType,
  onSuccess,
}: AddOldDebtDialogProps) {
  const { t } = useTranslation("debts")

  const form = useForm<AddOldDebtFormValues>({
    resolver: zodResolver(addOldDebtSchema),
    defaultValues: {
      entity_id: "",
      amount: "",
      currency: "UZS",
      exchange_rate: "",
    },
  })

  // Fetch suppliers or clients based on entityType
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersService.listSuppliers({ is_active: true }),
    enabled: open && entityType === "supplier",
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsService.getClients(1, 1000),
    enabled: open && entityType === "client",
  })

  // Pre-fill exchange rate from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      const rate = getExchangeRateNumber()
      form.setValue("exchange_rate", rate.toString())
    }
  }, [open, form])

  const mutation = useMutation({
    mutationFn: async (data: AddOldDebtFormValues) => {
      const entityId = Number(data.entity_id)
      if (entityType === "supplier") {
        await debtsService.createOldSupplierDebt({
          supplier: entityId,
          amount: data.amount,
          exchange_rate: data.exchange_rate,
          currency: data.currency,
        })
      } else {
        await debtsService.createOldClientDebt({
          client: entityId,
          amount: data.amount,
          exchange_rate: data.exchange_rate,
          currency: data.currency,
        })
      }
    },
    onSuccess: () => {
      toast.success(t("addOldDebt.success"))
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.message || t("addOldDebt.error"))
    },
  })

  const onSubmit = (data: AddOldDebtFormValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addOldDebt.title")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entity_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {entityType === "supplier" ? t("addOldDebt.selectSupplier") : t("addOldDebt.selectClient")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={entityType === "supplier" ? t("addOldDebt.selectSupplier") : t("addOldDebt.selectClient")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entityType === "supplier" ? (
                        suppliersData?.results.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.full_name} {supplier.company_name ? `(${supplier.company_name})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        clientsData?.results.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addOldDebt.amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("addOldDebt.amountPlaceholder")}
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
                  <FormLabel>{t("addOldDebt.currency")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addOldDebt.exchangeRate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="100"
                      min="0"
                      placeholder="1 USD = ... UZS"
                      {...field}
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
                disabled={mutation.isPending}
              >
                {t("actions.cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t("actions.submitting") : t("actions.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
