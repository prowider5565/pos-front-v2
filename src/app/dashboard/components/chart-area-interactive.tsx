"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { GraphDataPoint } from "@/types/analytics"

export const description = "An interactive area chart"

interface ChartAreaInteractiveProps {
  graphData?: GraphDataPoint[]
}

const chartConfig = {
  income_uzs: {
    label: "Income UZS",
    color: "hsl(142, 76%, 36%)", // Green
  },
  income_usd: {
    label: "Income USD",
    color: "hsl(142, 76%, 56%)", // Light green
  },
  debt_uzs: {
    label: "Debt UZS",
    color: "hsl(0, 84%, 60%)", // Red
  },
  debt_usd: {
    label: "Debt USD",
    color: "hsl(0, 84%, 80%)", // Light red
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ graphData }: ChartAreaInteractiveProps) {
  const { t } = useTranslation(['dashboard', 'common'])

  // Transform graph data from API to chart format
  const chartDataFromAPI = React.useMemo(() => {
    if (!graphData || graphData.length === 0) return []
    
    return graphData.map((item, index) => ({
      day: index + 1,
      income_uzs: parseFloat(item.income.uzs),
      income_usd: parseFloat(item.income.usd),
      debt_uzs: parseFloat(item.debt.uzs),
      debt_usd: parseFloat(item.debt.usd),
    }))
  }, [graphData])

  const displayData = chartDataFromAPI.length > 0 ? chartDataFromAPI : []

  return (
    <Card className="@container/card h-full">
      <CardHeader>
        <CardTitle>{t('dashboard:chart.lastTwoWeeksActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="fillIncomeUzs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income_uzs)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-income_uzs)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillIncomeUsd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income_usd)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-income_usd)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillDebtUzs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-debt_uzs)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-debt_uzs)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillDebtUsd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-debt_usd)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-debt_usd)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Day ${value}`}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="income_uzs"
              type="natural"
              fill="url(#fillIncomeUzs)"
              stroke="var(--color-income_uzs)"
              strokeWidth={2}
            />
            <Area
              dataKey="income_usd"
              type="natural"
              fill="url(#fillIncomeUsd)"
              stroke="var(--color-income_usd)"
              strokeWidth={2}
            />
            <Area
              dataKey="debt_uzs"
              type="natural"
              fill="url(#fillDebtUzs)"
              stroke="var(--color-debt_uzs)"
              strokeWidth={2}
            />
            <Area
              dataKey="debt_usd"
              type="natural"
              fill="url(#fillDebtUsd)"
              stroke="var(--color-debt_usd)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
