import * as React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check } from "lucide-react"
import { getExchangeRate, setExchangeRate } from "@/lib/exchange-rate-storage"
import { toast } from "sonner"

export function ExchangeRateInput() {
  const { t } = useTranslation("common")
  const [isEditing, setIsEditing] = React.useState(false)
  const [rate, setRate] = React.useState(getExchangeRate())

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    // Validate that rate is a valid number
    const numRate = parseFloat(rate)
    if (isNaN(numRate) || numRate <= 0) {
      toast.error(t("invalidExchangeRate"))
      return
    }

    setExchangeRate(rate)
    setIsEditing(false)
    toast.success(t("exchangeRateSaved"))
  }

  const handleCancel = () => {
    setRate(getExchangeRate())
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground hidden lg:inline">
        {t("exchangeRate")}:
      </div>
      <Input
        type="number"
        step="0.01"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        disabled={!isEditing}
        className="w-32 h-9"
        placeholder={t("exchangeRatePlaceholder")}
      />
      {!isEditing ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="h-9 w-9"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{t("edit")}</span>
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="h-9 w-9"
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">{t("save")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            {t("cancel")}
          </Button>
        </>
      )}
    </div>
  )
}
