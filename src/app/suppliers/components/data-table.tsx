"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
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
  Archive,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { SupplierFormDialog } from "./supplier-form-dialog"
import { suppliersService, type Supplier, type SuppliersListResponse } from "@/services/suppliers.service"

export function DataTable() {
  const { t } = useTranslation(['suppliers', 'common'])
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const params: {
        page?: number
        search?: string
        is_active?: boolean
      } = {
        page: currentPage,
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      if (statusFilter !== "all") {
        params.is_active = statusFilter === "active"
      }

      const response: SuppliersListResponse = await suppliersService.listSuppliers(params)
      setData(response.results)
      setTotalPages(response.total_pages)
      setTotalCount(response.count)
      setCurrentPage(response.current_page)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load suppliers"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [currentPage, statusFilter])

  // Check URL params for modal trigger
  useEffect(() => {
    const openModal = searchParams.get('openModal')
    
    if (openModal === 'true') {
      setCreateDialogOpen(true)
      // Clear the query param after opening modal
      searchParams.delete('openModal')
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        fetchSuppliers()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const generateAvatar = (supplier: Supplier) => {
    return supplier.company_name.substring(0, 2).toUpperCase()
  }

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!confirm(t('common:messages.confirmDelete'))) {
      return
    }
    
    try {
      await suppliersService.disableSupplier(supplierId)
      toast.success(t('messages.supplierDeleted'))
      fetchSuppliers()
    } catch (error) {
      console.error("Failed to delete supplier:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to delete supplier"
      })
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingSupplier(undefined)
    fetchSuppliers()
  }

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "company_name",
      header: t('table.companyName'),
      cell: ({ row }) => {
        const supplier = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium">
                {generateAvatar(supplier)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{supplier.company_name}</span>
              <span className="text-sm text-muted-foreground">{supplier.full_name}</span>
            </div>
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
      accessorKey: "product_count",
      header: t('table.productsDelivered'),
      cell: ({ row }) => {
        const supplier = row.original
        return <span className="text-sm">{supplier.product_count ?? 0}</span>
      },
    },
    {
      accessorKey: "deleted",
      header: t('table.status'),
      cell: ({ row }) => {
        const supplier = row.original
        const isActive = !supplier.deleted
        return (
          <Badge 
            variant="secondary" 
            className={
              isActive
                ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
            }
          >
            {isActive ? t('table.active') : t('table.inactive')}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: t('table.actions'),
      cell: ({ row }) => {
        const supplier = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => handleEditSupplier(supplier)}
              title={t('common:actions.edit')}
            >
              <Pencil className="size-4" />
              <span className="sr-only">{t('common:actions.edit')}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
              onClick={() => handleDeleteSupplier(supplier.id)}
              title={t('common:actions.archive')}
            >
              <Archive className="size-4" />
              <span className="sr-only">{t('common:actions.archive')}</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <SupplierFormDialog 
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={fetchSuppliers} 
          />
          <SupplierFormDialog 
            supplier={editingSupplier} 
            onSuccess={handleEditSuccess}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            {t('table.status')}
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder={t('table.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">{t('table.active')}</SelectItem>
              <SelectItem value="inactive">{t('table.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
          {totalCount} {t('common:table.totalRecords')}
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
