import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type FilterType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface DateFilterParams {
  day?: number
  week?: number
  month?: number
  year?: number
  date_from?: string
  date_to?: string
}

interface DashboardFilterProps {
  onFilterChange: (type: FilterType, params: DateFilterParams) => void
}

export function DashboardFilter({ onFilterChange }: DashboardFilterProps) {
  const { t } = useTranslation('dashboard')
  const [activeFilter, setActiveFilter] = useState<FilterType>('monthly')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: undefined, to: undefined })

  const handleFilterClick = (type: FilterType) => {
    setActiveFilter(type)
    const now = new Date()
    
    switch (type) {
      case 'daily':
        onFilterChange(type, {
          day: now.getDate(),
          year: now.getFullYear(),
        })
        break
      
      case 'weekly':
        // Get ISO week number
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
        
        onFilterChange(type, {
          week: weekNumber,
          year: now.getFullYear(),
        })
        break
      
      case 'monthly':
        onFilterChange(type, {
          month: now.getMonth() + 1, // JavaScript months are 0-indexed
          year: now.getFullYear(),
        })
        break
    }
  }

  const handleCustomDateApply = () => {
    if (dateRange.from && dateRange.to) {
      setActiveFilter('custom')
      onFilterChange('custom', {
        date_from: format(dateRange.from, 'yyyy-MM-dd'),
        date_to: format(dateRange.to, 'yyyy-MM-dd'),
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activeFilter === 'custom' ? 'default' : 'outline'}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {t('dateFilter.customDatePeriod')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
            numberOfMonths={2}
          />
          <div className="p-3 border-t">
            <Button
              onClick={handleCustomDateApply}
              disabled={!dateRange.from || !dateRange.to}
              className="w-full"
            >
              Apply Date Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={activeFilter === 'daily' ? 'default' : 'outline'}
        onClick={() => handleFilterClick('daily')}
      >
        {t('dateFilter.daily')}
      </Button>

      <Button
        variant={activeFilter === 'weekly' ? 'default' : 'outline'}
        onClick={() => handleFilterClick('weekly')}
      >
        {t('dateFilter.weekly')}
      </Button>

      <Button
        variant={activeFilter === 'monthly' ? 'default' : 'outline'}
        onClick={() => handleFilterClick('monthly')}
      >
        {t('dateFilter.monthly')}
      </Button>
    </div>
  )
}
