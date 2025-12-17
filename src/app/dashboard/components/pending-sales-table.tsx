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
import { ArrowUpDown, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { PendingSale } from "@/types/analytics"
import type { DateFilterParams } from "./dashboard-filter"
import { usePendingSales } from "@/hooks/use-analytics"
import { formatVerboseDate } from "@/lib/date-utils"
import { getStatusTranslationKey, getStatusVariant } from "@/lib/status-utils"
import { PaginationControls } from "@/components/ui/pagination-controls"

interface PendingSalesTableProps {
  filterParams?: DateFilterParams
}

const createColumns = (t: any): ColumnDef<PendingSale>[] => [
  {
    accessorKey: "client_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('dashboard:table.clientName')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("client_name")}</div>,
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('dashboard:table.totalAmountUZS')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"))
      return <div className="font-semibold">{amount.toLocaleString()} UZS</div>
    },
  },
  {
    id: "total_amount_usd",
    header: t('dashboard:table.totalAmountUSD'),
    cell: ({ row }) => {
      const amount = parseFloat(row.original.total_amount)
      const rate = parseFloat(row.original.exchange_rate)
      const usdAmount = amount / rate
      return <div className="font-semibold">${usdAmount.toFixed(2)}</div>
    },
  },
  {
    accessorKey: "discount_amount",
    header: t('dashboard:table.discountUZS'),
    cell: ({ row }) => {
      const discount = parseFloat(row.getValue("discount_amount"))
      return <div>{discount.toLocaleString()} UZS</div>
    },
  },
  {
    id: "discount_amount_usd",
    header: t('dashboard:table.discountUSD'),
    cell: ({ row }) => {
      const discount = parseFloat(row.original.discount_amount)
      const rate = parseFloat(row.original.exchange_rate)
      const usdDiscount = discount / rate
      return <div>${usdDiscount.toFixed(2)}</div>
    },
  },
  {
    accessorKey: "status",
    header: t('dashboard:table.status'),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const translationKey = getStatusTranslationKey(status)
      return (
        <Badge variant={getStatusVariant(status)}>
          {t(`dashboard:${translationKey}`)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "exchange_rate",
    header: t('dashboard:table.exchangeRate'),
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("exchange_rate"))
      return <div>{rate.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "needs_cheque",
    header: t('dashboard:table.needsCheque'),
    cell: ({ row }) => {
      const needsCheque = row.getValue("needs_cheque") as boolean
      return (
        <div className="flex justify-center">
          {needsCheque ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-red-600" />
          )}
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

export function PendingSalesTable({ filterParams }: PendingSalesTableProps) {
  const { t } = useTranslation(["dashboard", "common"])
  const [page, setPage] = React.useState(1)
  const { data, isLoading, isError } = usePendingSales(filterParams, page)
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1)
  }, [filterParams])

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
        Failed to load pending sales
      </div>
    )
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending sales found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={t('dashboard:table.filterByClient')}
          value={(table.getColumn("client_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("client_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {t('dashboard:table.total')}: {t('dashboard:metrics.salesCount', { count: data.count })}
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
