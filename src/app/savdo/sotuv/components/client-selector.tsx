"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { clientsService } from "@/services/clients.service"
import { toast } from "sonner"

interface Client {
  id: number
  full_name: string
  phone_number: string
}

interface ClientSelectorProps {
  selectedClientId: number | null
  onClientSelect: (clientId: number | null) => void
  hasRemaining: boolean
}

export function ClientSelector({
  selectedClientId,
  onClientSelect,
  hasRemaining,
}: ClientSelectorProps) {
  const { t } = useTranslation('sales')
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  const selectedClient = clients.find((client) => client.id === selectedClientId)

  const getClientLabel = (client: Client) => {
    // Show full name prominently; include phone as secondary info in the dropdown.
    return client.full_name
  }

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const response = await clientsService.getClients()
        setClients(response.results || [])
      } catch (error) {
        console.error('Failed to fetch clients:', error)
        toast.error(t('messages.loadError'))
      } finally {
        setLoading(false)
      }
    }

    if (open && clients.length === 0) {
      fetchClients()
    }
  }, [open, clients.length, t])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold">{t('client.selectClient')}</Label>
        {hasRemaining && (
          <AlertCircle className="h-4 w-4 text-orange-600" />
        )}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              hasRemaining && !selectedClientId && "border-orange-600"
            )}
          >
            {selectedClient ? (
              <span className="truncate">{getClientLabel(selectedClient)}</span>
            ) : (
              <span className="text-muted-foreground">{t('client.selectPlaceholder')}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('client.searchPlaceholder')} />
            <CommandEmpty>
              {loading ? t('loading') : t('client.noClient')}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.full_name} ${client.phone_number}`}
                  onSelect={() => {
                    onClientSelect(client.id === selectedClientId ? null : client.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClientId === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.full_name}</span>
                    <span className="text-xs text-muted-foreground">{client.phone_number}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {hasRemaining && !selectedClientId && (
        <p className="text-xs text-orange-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {t('client.required')}
        </p>
      )}
    </div>
  )
}
