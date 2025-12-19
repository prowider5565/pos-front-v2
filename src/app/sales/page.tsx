"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import type { SalesListQueryParams } from "@/types/sales"
import { BaseLayout } from "@/components/layouts/base-layout"
import { salesService } from "@/services/sales.service"
import { DataTable } from "./components/data-table"
import { columns } from "./components/columns"
import {
  SalesFilters,
  type DateFilterMode,
  type SalesFiltersValue,
} from "./components/sales-filters"

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return n
}

function parseOptionalBool(value: string | null): boolean | undefined {
  if (!value) return undefined
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

function inferDateMode(params: URLSearchParams): DateFilterMode {
  if (params.get("date_from") || params.get("date_to")) return "range"
  if (params.get("day")) return "day"
  if (params.get("week")) return "week"
  if (params.get("month")) return "month"
  if (params.get("year")) return "year"
  return "none"
}

export default function SalesListPage() {
  const { t } = useTranslation('sales')
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtersValue: SalesFiltersValue = useMemo(() => {
    return {
      dateMode: inferDateMode(searchParams),
      client: parseOptionalInt(searchParams.get("client")),
      status: (searchParams.get("status") as SalesFiltersValue["status"]) || undefined,
      needs_cheque: parseOptionalBool(searchParams.get("needs_cheque")),
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      day: searchParams.get("day") || undefined,
      week: parseOptionalInt(searchParams.get("week")),
      month: parseOptionalInt(searchParams.get("month")),
      year: parseOptionalInt(searchParams.get("year")),
    }
  }, [searchParams])

  const queryParams: SalesListQueryParams = useMemo(() => {
    const qp: SalesListQueryParams = {
      page,
      page_size: pageSize,
    }

    if (filtersValue.client) qp.client = filtersValue.client
    if (filtersValue.status) qp.status = filtersValue.status
    if (filtersValue.needs_cheque !== undefined) qp.needs_cheque = filtersValue.needs_cheque

    // Date filters (mutually exclusive via dateMode UI)
    if (filtersValue.dateMode === "range") {
      if (filtersValue.date_from) qp.date_from = filtersValue.date_from
      if (filtersValue.date_to) qp.date_to = filtersValue.date_to
    }
    if (filtersValue.dateMode === "day" && filtersValue.day) qp.day = filtersValue.day
    if (filtersValue.dateMode === "week") {
      if (filtersValue.week) qp.week = filtersValue.week
      if (filtersValue.year) qp.year = filtersValue.year
    }
    if (filtersValue.dateMode === "month") {
      if (filtersValue.month) qp.month = filtersValue.month
      if (filtersValue.year) qp.year = filtersValue.year
    }
    if (filtersValue.dateMode === "year" && filtersValue.year) qp.year = filtersValue.year

    return qp
  }, [filtersValue, page, pageSize])

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-list', page, filtersValue],
    queryFn: () => salesService.getSalesList(queryParams),
  })

  return (
    <BaseLayout
      title={t('history.title')}
      description={t('history.subtitle')}
    >
      <div className="space-y-4 p-6">
        <SalesFilters
          t={t}
          value={filtersValue}
          onApply={(next) => {
            const nextParams = new URLSearchParams()

            if (next.client) nextParams.set("client", String(next.client))
            if (next.status) nextParams.set("status", next.status)
            if (next.needs_cheque !== undefined) {
              nextParams.set("needs_cheque", String(next.needs_cheque))
            }

            if (next.dateMode === "range") {
              if (next.date_from) nextParams.set("date_from", next.date_from)
              if (next.date_to) nextParams.set("date_to", next.date_to)
            }
            if (next.dateMode === "day") {
              if (next.day) nextParams.set("day", next.day)
            }
            if (next.dateMode === "week") {
              if (next.week) nextParams.set("week", String(next.week))
              if (next.year) nextParams.set("year", String(next.year))
            }
            if (next.dateMode === "month") {
              if (next.month) nextParams.set("month", String(next.month))
              if (next.year) nextParams.set("year", String(next.year))
            }
            if (next.dateMode === "year") {
              if (next.year) nextParams.set("year", String(next.year))
            }

            setSearchParams(nextParams)
            setPage(1)
          }}
          onReset={() => {
            setSearchParams(new URLSearchParams())
            setPage(1)
          }}
        />

        <DataTable
          columns={columns(t)}
          data={data?.results || []}
          isLoading={isLoading}
          error={error}
          pagination={{
            currentPage: page,
            totalCount: data?.count || 0,
            pageSize,
            onPageChange: setPage,
          }}
        />
      </div>
    </BaseLayout>
  )
}
