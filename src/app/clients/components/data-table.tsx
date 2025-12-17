"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Pencil,
  Trash2,
  Search,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClientFormDialog } from "./client-form-dialog"
import { clientsService, type Client, type ClientsListResponse } from "@/services/clients.service"

export function DataTable() {
  const { t } = useTranslation(['clients', 'common'])
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Memoized fetch function
  const fetchClients = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const response: ClientsListResponse = await clientsService.getClients(page, 10)
      setData(response.results)
      setTotalPages(Math.ceil(response.count / 10))
      setTotalCount(response.count)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load clients"
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  // Single effect with debouncing for page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(currentPage)
    }, 300)

    return () => clearTimeout(timer)
  }, [currentPage, fetchClients])

  const generateAvatar = (client: Client) => {
    return client.full_name.substring(0, 2).toUpperCase()
  }

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm(t('common:messages.confirmDelete'))) {
      return
    }
    
    try {
      await clientsService.deleteClient(clientId)
      toast.success(t('messages.clientDeleted'))
      fetchClients()
    } catch (error) {
      console.error("Failed to delete client:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to delete client"
      })
    }
  }

  const handleAddClient = () => {
    setSelectedClient(null)
    setIsDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedClient(null)
  }

  const handleDialogSuccess = () => {
    handleDialogClose()
    fetchClients()
  }

  const formatDebt = useCallback((client: Client) => {
    if (!client.old_debt || !client.old_debt.amount) {
      return "-"
    }
    const amount = parseFloat(client.old_debt.amount)
    const currency = client.old_debt.currency
    return `${amount.toLocaleString()} ${currency}`
  }, [])

  // Memoized columns - only recreate when translation changes
  const columns = useMemo<ColumnDef<Client>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "full_name",
      header: t('table.fullName'),
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium">
                {generateAvatar(client)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{client.full_name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "phone_number",
      header: t('table.phoneNumber'),
      cell: ({ row }) => {
        const phone = row.getValue("phone_number") as string
        return <span className="text-sm">{phone}</span>
      },
    },
    {
      accessorKey: "old_debt",
      header: t('table.oldDebt'),
      cell: ({ row }) => {
        const client = row.original
        return <span className="text-sm">{formatDebt(client)}</span>
      },
    },
    {
      id: "actions",
      header: t('table.actions'),
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => handleEditClient(client)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit client</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
              onClick={() => handleDeleteClient(client.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete client</span>
            </Button>
          </div>
        )
      },
    },
  ], [t, handleEditClient, handleDeleteClient, formatDebt])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    globalFilterFn: (row, columnId, filterValue: string) => {
      const searchValue = filterValue.toLowerCase()
      const fullName = row.original.full_name.toLowerCase()
      const phoneNumber = row.original.phone_number.toLowerCase()
      return fullName.includes(searchValue) || phoneNumber.includes(searchValue)
    },
  })

  // Handle search with React Table's global filter
  const handleSearch = useCallback((value: string) => {
    table.setGlobalFilter(value)
  }, [table])

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={(table.getState().globalFilter as string) ?? ""}
              onChange={(event) => handleSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleAddClient}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addClient')}
          </Button>
        </div>
      </div>

      {/* Dialog handles its own mounting based on open prop */}
      <ClientFormDialog 
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        client={selectedClient}
        onSuccess={handleDialogSuccess}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('common:actions.loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('common:messages.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} {t('common:table.of')}{" "}
          {totalCount} {t('common:table.rowsSelected')}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2 hidden sm:flex">
            <p className="text-sm font-medium">{t('common:table.page')}</p>
            <strong className="text-sm">
              {currentPage} {t('common:table.of')} {totalPages}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="cursor-pointer"
            >
              {t('common:table.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="cursor-pointer"
            >
              {t('common:table.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
