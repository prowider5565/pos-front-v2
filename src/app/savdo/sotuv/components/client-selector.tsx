"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
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
import { ClientFormDialog } from "@/app/clients/components/client-form-dialog"

interface Client {
  id: number
  full_name: string
  phone_number: string
}

interface ClientSelectorProps {
  selectedClientId: number | null
  onClientSelect: (clientId: number | null) => void
}

export function ClientSelector({
  selectedClientId,
  onClientSelect,
}: ClientSelectorProps) {
  const { t } = useTranslation(['sales', 'clients'])
  const [open, setOpen] = useState(false)
  const [createClientOpen, setCreateClientOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  const selectedClient = clients.find((client) => client.id === selectedClientId)

  const getClientLabel = (client: Client) => {
    // Show full name prominently; include phone as secondary info in the dropdown.
    return client.full_name
  }

  const fetchClients = useCallback(async () => {
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
  }, [t])

  // Fetch clients
  useEffect(() => {
    if (open && clients.length === 0) {
      fetchClients()
    }
  }, [open, clients.length, fetchClients])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold">{t('client.selectClient')}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCreateClientOpen(true)}
          aria-label={t('clients:addClient')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
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

      <ClientFormDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        client={null}
        onSuccess={async () => {
          await fetchClients()
          setCreateClientOpen(false)
        }}
      />
    </div>
  )
}
