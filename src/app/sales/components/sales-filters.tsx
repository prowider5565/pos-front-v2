import { useEffect, useMemo, useState } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import type { SaleStatus, SalesListFilterParams } from "@/types/sales"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { clientsService } from "@/services/clients.service"

export type DateFilterMode = "none" | "range" | "day" | "week" | "month" | "year"

export interface SalesFiltersValue extends SalesListFilterParams {
  dateMode: DateFilterMode
}

interface ClientOption {
  id: number
  full_name: string
  phone_number: string
}

function getIsoWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  )
  return Math.ceil((days + 1) / 7)
}

export function SalesFilters({
  t,
  value,
  onApply,
}: {
  t: TFunction
  value: SalesFiltersValue
  onApply: (next: SalesFiltersValue) => void
  onReset: () => void
}) {
  const { t: tSales } = useTranslation('sales')
  const [draft, setDraft] = useState<SalesFiltersValue>(value)

  // keep draft in sync when parent updates from URL
  useEffect(() => {
    setDraft(value)
  }, [value])

  // Apply filters instantly with debounce to prevent too many history API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onApply(draft)
    }, 300)

    return () => clearTimeout(timer)
  }, [draft, onApply])

  // --- Clients combobox state ---
  const [clientOpen, setClientOpen] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])

  const selectedClient = useMemo(() => {
    if (!draft.client) return undefined
    return clients.find((c) => c.id === draft.client)
  }, [clients, draft.client])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true)
        const res = await clientsService.getClients(1, 100)
        setClients(res.results || [])
      } finally {
        setClientsLoading(false)
      }
    }

    if (clientOpen && clients.length === 0 && !clientsLoading) {
      fetchClients().catch(() => {
        // swallow; UI shows empty state
      })
    }
  }, [clientOpen, clients.length, clientsLoading])

  const statusItems: Array<{ value: SaleStatus; label: string }> = [
    { value: "PENDING", label: tSales("filters.pending") },
    { value: "PARTIALLY_PAID", label: tSales("filters.partiallyPaid") },
    { value: "PAID", label: tSales("filters.paid") },
  ]

  const needsChequeValue =
    draft.needs_cheque === undefined
      ? "any"
      : draft.needs_cheque
        ? "true"
        : "false"

  const setDateMode = (mode: DateFilterMode) => {
    setDraft((prev) => ({
      ...prev,
      dateMode: mode,
      date_from: undefined,
      date_to: undefined,
      day: undefined,
      week: undefined,
      month: undefined,
      year: undefined,
    }))
  }

  const [range, setRange] = useState<DateRange | undefined>(undefined)

  const applyDaily = () => {
    const now = new Date()
    setDraft((prev) => ({
      ...prev,
      dateMode: "day",
      date_from: undefined,
      date_to: undefined,
      week: undefined,
      month: undefined,
      year: undefined,
      day: format(now, "yyyy-MM-dd"),
    }))
  }

  const applyWeekly = () => {
    const now = new Date()
    setDraft((prev) => ({
      ...prev,
      dateMode: "week",
      date_from: undefined,
      date_to: undefined,
      day: undefined,
      month: undefined,
      week: getIsoWeekNumber(now),
      year: now.getFullYear(),
    }))
  }

  const applyMonthly = () => {
    const now = new Date()
    setDraft((prev) => ({
      ...prev,
      dateMode: "month",
      date_from: undefined,
      date_to: undefined,
      day: undefined,
      week: undefined,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }))
  }

  const applyYearly = () => {
    const now = new Date()
    setDraft((prev) => ({
      ...prev,
      dateMode: "year",
      date_from: undefined,
      date_to: undefined,
      day: undefined,
      week: undefined,
      month: undefined,
      year: now.getFullYear(),
    }))
  }

  const applyCustomRange = () => {
    if (!range?.from || !range?.to) return
    setDraft((prev) => ({
      ...prev,
      dateMode: "range",
      date_from: format(range.from as Date, "yyyy-MM-dd"),
      date_to: format(range.to as Date, "yyyy-MM-dd"),
      day: undefined,
      week: undefined,
      month: undefined,
      year: undefined,
    }))
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      {/* First Row: Date filters and Cheque Radio */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Date filter buttons */}
        <div className="space-y-2 flex-1 min-w-[300px]">
          <Label>{tSales("filters.dateRange")}</Label>
          <div className="flex flex-wrap items-center gap-2">
            {/* Custom range picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={draft.dateMode === "range" ? "default" : "outline"}
                  className="gap-2"
                  size="sm"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {tSales("filters.range")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t">
                  <Button
                    onClick={applyCustomRange}
                    disabled={!range?.from || !range?.to}
                    className="w-full"
                    size="sm"
                  >
                    {tSales("filters.applyDateRange")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={draft.dateMode === "day" ? "default" : "outline"}
              onClick={applyDaily}
              size="sm"
            >
              {tSales("filters.daily")}
            </Button>

            <Button
              variant={draft.dateMode === "week" ? "default" : "outline"}
              onClick={applyWeekly}
              size="sm"
            >
              {tSales("filters.weekly")}
            </Button>

            <Button
              variant={draft.dateMode === "month" ? "default" : "outline"}
              onClick={applyMonthly}
              size="sm"
            >
              {tSales("filters.monthly")}
            </Button>

            <Button
              variant={draft.dateMode === "year" ? "default" : "outline"}
              onClick={applyYearly}
              size="sm"
            >
              {tSales("filters.yearly")}
            </Button>

            <Button
              variant={draft.dateMode === "none" ? "default" : "outline"}
              onClick={() => setDateMode("none")}
              size="sm"
            >
              {tSales("filters.allTime")}
            </Button>
          </div>
        </div>

        {/* Needs cheque radio - on same row */}
        <div className="space-y-2">
          <Label>{tSales("filters.needsCheque")}</Label>
          <RadioGroup
            value={needsChequeValue}
            onValueChange={(v) => {
              setDraft((prev) => ({
                ...prev,
                needs_cheque: v === "any" ? undefined : v === "true",
              }))
            }}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="any" id="cheque-any" />
              <Label htmlFor="cheque-any" className="font-normal cursor-pointer">
                {tSales("filters.any")}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="true" id="cheque-yes" />
              <Label htmlFor="cheque-yes" className="font-normal cursor-pointer">
                {tSales("filters.yes")}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="false" id="cheque-no" />
              <Label htmlFor="cheque-no" className="font-normal cursor-pointer">
                {tSales("filters.no")}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Second Row: Client and Payment Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Client combobox */}
        <div className="space-y-2">
          <Label>{t("history.columns.client")}</Label>
          <Popover open={clientOpen} onOpenChange={setClientOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedClient ? (
                  <span className="truncate">{selectedClient.full_name}</span>
                ) : (
                  <span className="text-muted-foreground">{t("client.selectPlaceholder")}</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder={t("client.searchPlaceholder")} />
                <CommandEmpty>
                  {clientsLoading ? t("loading") : t("client.noClient")}
                </CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {/* Allow clearing */}
                  <CommandItem
                    value="__any__"
                    onSelect={() => {
                      setDraft((prev) => ({ ...prev, client: undefined }))
                      setClientOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !draft.client ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-sm">All clients</span>
                  </CommandItem>
                  {clients.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.full_name} ${c.phone_number}`}
                      onSelect={() => {
                        setDraft((prev) => ({ ...prev, client: c.id }))
                        setClientOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          draft.client === c.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{c.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.phone_number}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Payment status select */}
        <div className="space-y-2">
          <Label>{tSales("filters.paymentStatus")}</Label>
          <Select
            value={draft.status || "__any__"}
            onValueChange={(v) => {
              setDraft((prev) => ({
                ...prev,
                status: v === "__any__" ? undefined : (v as SaleStatus),
              }))
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">{tSales("filters.allStatuses")}</SelectItem>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
