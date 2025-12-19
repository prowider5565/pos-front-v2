import { useEffect, useMemo, useState } from "react"
import type { TFunction } from "i18next"
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
  // Same rough approach used in dashboard-filter.tsx (works with the backend’s expected week numbering)
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  )
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

export function SalesFilters({
  t,
  value,
  onApply,
  onReset,
}: {
  t: TFunction
  value: SalesFiltersValue
  onApply: (next: SalesFiltersValue) => void
  onReset: () => void
}) {
  const [draft, setDraft] = useState<SalesFiltersValue>(value)

  // keep draft in sync when parent updates from URL
  useEffect(() => {
    setDraft(value)
  }, [value])

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
        // Load more than default for usability
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
    { value: "PENDING", label: t("history.status.PENDING") },
    { value: "PARTIALLY_PAID", label: t("history.status.PARTIALLY_PAID") },
    { value: "PAID", label: t("history.status.PAID") },
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
      // clear all date fields (we’ll set the relevant ones after)
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
      month: now.getMonth() + 1,
      year: now.getFullYear(),
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
    const from = range.from
    const to = range.to

    setDraft((prev) => ({
      ...prev,
      dateMode: "range",
      day: undefined,
      week: undefined,
      month: undefined,
      year: undefined,
      date_from: format(from, "yyyy-MM-dd"),
      date_to: format(to, "yyyy-MM-dd"),
    }))
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`${client.full_name} ${client.phone_number}`}
                      onSelect={() => {
                        setDraft((prev) => ({ ...prev, client: client.id }))
                        setClientOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          draft.client === client.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{client.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.phone_number}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>{t("history.columns.status")}</Label>
          <Select
            value={draft.status ?? "__any__"}
            onValueChange={(v) => {
              setDraft((prev) => ({
                ...prev,
                status: v === "__any__" ? undefined : (v as SaleStatus),
              }))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">All</SelectItem>
              {statusItems.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Needs cheque radio */}
        <div className="space-y-2">
          <Label>Needs cheque</Label>
          <RadioGroup
            value={needsChequeValue}
            onValueChange={(v) => {
              setDraft((prev) => ({
                ...prev,
                needs_cheque: v === "any" ? undefined : v === "true",
              }))
            }}
            className="grid grid-cols-3 gap-3"
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="any" />
              Any
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="true" />
              Yes
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="false" />
              No
            </Label>
          </RadioGroup>
        </div>

        {/* Date filter (dashboard-style) */}
        <div className="space-y-2">
          <Label>Date</Label>
          <div className="flex flex-wrap items-center gap-2">
            {/* Custom range picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={draft.dateMode === "range" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setDateMode("range")}
                >
                  <CalendarIcon className="h-4 w-4" />
                  Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
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
                  >
                    Apply Date Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={draft.dateMode === "day" ? "default" : "outline"}
              onClick={applyDaily}
            >
              Daily
            </Button>

            <Button
              variant={draft.dateMode === "week" ? "default" : "outline"}
              onClick={applyWeekly}
            >
              Weekly
            </Button>

            <Button
              variant={draft.dateMode === "month" ? "default" : "outline"}
              onClick={applyMonthly}
            >
              Monthly
            </Button>

            <Button
              variant={draft.dateMode === "year" ? "default" : "outline"}
              onClick={applyYearly}
            >
              Yearly
            </Button>

            <Button
              variant={draft.dateMode === "none" ? "default" : "outline"}
              onClick={() => setDateMode("none")}
            >
              All time
            </Button>
          </div>

          {/* Optional: show current active date selection summary */}
          <div className="text-xs text-muted-foreground">
            {draft.dateMode === "none" && "No date filter"}
            {draft.dateMode === "day" && draft.day && `Day: ${draft.day}`}
            {draft.dateMode === "week" && draft.week && draft.year &&
              `Week: ${draft.week}, ${draft.year}`}
            {draft.dateMode === "month" && draft.month && draft.year &&
              `Month: ${draft.month}, ${draft.year}`}
            {draft.dateMode === "year" && draft.year && `Year: ${draft.year}`}
            {draft.dateMode === "range" && draft.date_from && draft.date_to &&
              `Range: ${draft.date_from} → ${draft.date_to}`}
          </div>
        </div>
      </div>

      {/* Apply/Reset */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
        <Button onClick={() => onApply(draft)}>Apply</Button>
      </div>
    </div>
  )
}
