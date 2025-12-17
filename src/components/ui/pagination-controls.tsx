import { useTranslation } from "react-i18next"
import { Button } from "./button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
  onPageChange: (page: number) => void
}

export function PaginationControls({
  currentPage,
  totalCount,
  hasNext,
  hasPrevious,
  onPageChange,
}: PaginationControlsProps) {
  const { t } = useTranslation("dashboard")

  const handlePrevious = () => {
    if (hasPrevious) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onPageChange(currentPage + 1)
    }
  }

  // Calculate approximate total pages (since backend doesn't provide it)
  // Assuming 10 items per page
  const itemsPerPage = 10
  const estimatedTotalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {t("pagination.showing")} {t("pagination.page")} {currentPage} {t("pagination.of")} ~{estimatedTotalPages} ({totalCount} {t("pagination.total")})
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("pagination.previous")}
        </Button>
        <div className="text-sm font-medium">
          {t("pagination.page")} {currentPage}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext}
          className="gap-1"
        >
          {t("pagination.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
