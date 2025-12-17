import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { LowStockProduct } from "@/types/analytics"
import { useLowStockProducts } from "@/hooks/use-analytics"
import { MEDIA_BASE_URL } from "@/config/api"
import { formatVerboseDate } from "@/lib/date-utils"
import { PaginationControls } from "@/components/ui/pagination-controls"

const createColumns = (t: any): ColumnDef<LowStockProduct>[] => [
  {
    accessorKey: "image",
    header: t('dashboard:table.image'),
    cell: ({ row }) => (
      <div className="w-16 h-16 rounded overflow-hidden bg-muted">
        {row.getValue("image") ? (
          <img
            src={`${MEDIA_BASE_URL}${row.getValue("image")}`}
            alt={row.getValue("name")}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('dashboard:table.name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "category_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('dashboard:table.category')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("category_name")}</div>,
  },
  {
    accessorKey: "product_type",
    header: t('dashboard:table.type'),
    cell: ({ row }) => <div className="capitalize">{row.getValue("product_type")}</div>,
  },
  {
    accessorKey: "total_quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('dashboard:table.quantity')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const quantity = row.getValue("total_quantity") as number
      return (
        <div className={`font-semibold ${quantity <= 5 ? "text-red-600" : "text-yellow-600"}`}>
          {quantity}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('dashboard:table.createdAt')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const locale = t('common:locale', { defaultValue: 'en' })
      return <div>{formatVerboseDate(row.getValue("created_at"), locale)}</div>
    },
  },
]

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export function LowStockTable() {
  const { t } = useTranslation(["dashboard", "common"])
  const [page, setPage] = React.useState(1)
  const { data, isLoading, isError } = useLowStockProducts(undefined, page)
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const columns = React.useMemo(() => createColumns(t), [t])

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load low stock products
      </div>
    )
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No low stock products found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={t('dashboard:table.filterByName')}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {t('dashboard:table.total')}: {t('dashboard:metrics.productsCount', { count: data.count })}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  {t('dashboard:table.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 0 && (
        <PaginationControls
          currentPage={page}
          totalCount={data.count}
          hasNext={!!data.next}
          hasPrevious={!!data.previous}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
