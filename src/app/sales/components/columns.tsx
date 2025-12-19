import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { SaleListItem } from "@/types/sales"
import type { TFunction } from "i18next"
import { format } from "date-fns"

export const columns = (
  t: TFunction
): ColumnDef<SaleListItem>[] => [
  {
    accessorKey: "id",
    header: t('history.columns.id'),
    cell: ({ row }) => (
      <div className="font-medium">#{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "sale_date",
    header: t('history.columns.date'),
    cell: ({ row }) => {
      const date = new Date(row.getValue("sale_date"))
      return (
        <div className="whitespace-nowrap">
          {format(date, 'dd MMM yyyy, HH:mm')}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: t('history.columns.status'),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <Badge variant="outline">{t(`history.status.${status}`)}</Badge>
    },
  },
  {
    accessorKey: "client_full_name",
    header: t('history.columns.client'),
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">
        {row.getValue("client_full_name")}
      </div>
    ),
  },
  {
    accessorKey: "number_of_products",
    header: t('history.columns.items'),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("number_of_products")}</div>
    ),
  },
  {
    id: "total",
    header: t('history.columns.total'),
    cell: ({ row }) => {
      const amounts = row.original.debt_amounts.total_amount
      return (
        <div className="text-right">
          <div className="font-medium">
            {parseFloat(amounts.uzs_amount).toLocaleString()} UZS
          </div>
          <div className="text-xs text-muted-foreground">
            ${parseFloat(amounts.usd_amount).toFixed(2)}
          </div>
        </div>
      )
    },
  },
  {
    id: "paid",
    header: t('history.columns.paid'),
    cell: ({ row }) => {
      const amounts = row.original.debt_amounts.total_paid
      return (
        <div className="text-right">
          <div className="font-medium text-green-600">
            {parseFloat(amounts.uzs_amount).toLocaleString()} UZS
          </div>
          <div className="text-xs text-muted-foreground">
            ${parseFloat(amounts.usd_amount).toFixed(2)}
          </div>
        </div>
      )
    },
  },
  {
    id: "remaining",
    header: t('history.columns.remaining'),
    cell: ({ row }) => {
      const amounts = row.original.debt_amounts.total_remaining
      const remaining = parseFloat(amounts.uzs_amount)
      return (
        <div className="text-right">
          <div className={`font-medium ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {remaining.toLocaleString()} UZS
          </div>
          <div className="text-xs text-muted-foreground">
            ${parseFloat(amounts.usd_amount).toFixed(2)}
          </div>
        </div>
      )
    },
  },
]
