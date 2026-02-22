import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { debtsService } from "@/services/debts.service"
import type { OldDebtsForChequeResponse } from "@/types/debts"
import type { SaleDetail } from "@/types/sales"

interface ChequePreviewProps {
  saleData?: SaleDetail | null
  oldDebts?: OldDebtsForChequeResponse | null
}

export interface ChequePreviewHandle {
  getAsciiText: () => string
}

const CHEQUE_WIDTH = 42

const formatNumber = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "0"

  const hasDecimals = num % 1 !== 0
  const formatted = hasDecimals ? num.toFixed(2) : num.toFixed(0)
  const parts = formatted.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}

const formatUsd = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "0.00"
  return num.toFixed(2)
}

const padRight = (text: string, width: number): string => {
  if (text.length >= width) return text.slice(0, width)
  return text + " ".repeat(width - text.length)
}

const padLeft = (text: string, width: number): string => {
  if (text.length >= width) return text.slice(0, width)
  return " ".repeat(width - text.length) + text
}

const padCenter = (text: string, width: number): string => {
  if (text.length >= width) return text.slice(0, width)
  const totalPad = width - text.length
  const leftPad = Math.floor(totalPad / 2)
  const rightPad = totalPad - leftPad
  return " ".repeat(leftPad) + text + " ".repeat(rightPad)
}

const kvLine = (label: string, value: string, width = CHEQUE_WIDTH): string => {
  const safeValue = value || "-"
  const spaces = Math.max(1, width - label.length - safeValue.length)
  return `${label}${" ".repeat(spaces)}${safeValue}`
}

const splitByWidth = (text: string, width: number): string[] => {
  if (!text) return [""]

  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= width) {
      current = candidate
      return
    }

    if (current) lines.push(current)

    if (word.length <= width) {
      current = word
      return
    }

    let rest = word
    while (rest.length > width) {
      lines.push(rest.slice(0, width))
      rest = rest.slice(width)
    }
    current = rest
  })

  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

export const ChequePreview = forwardRef<ChequePreviewHandle, ChequePreviewProps>(
  ({ saleData, oldDebts: providedOldDebts }, ref) => {
    const { user } = useAuth()
    const [oldDebts, setOldDebts] = useState<OldDebtsForChequeResponse | null>(providedOldDebts || null)
    const [isLoading, setIsLoading] = useState(false)
    const [asciiText, setAsciiText] = useState<string>("")

    useEffect(() => {
      const fetchOldDebts = async () => {
        if (!providedOldDebts && saleData?.client?.id) {
          setIsLoading(true)
          try {
            const debts = await debtsService.getOldDebtsForCheque(saleData.client.id)
            setOldDebts(debts)
          } catch (error) {
            console.error("Failed to fetch old debts for cheque:", error)
            setOldDebts({ total_usd: "0", total_uzs: "0" })
          } finally {
            setIsLoading(false)
          }
        } else if (providedOldDebts) {
          setOldDebts(providedOldDebts)
        }
      }

      fetchOldDebts()
    }, [saleData?.client?.id, providedOldDebts])

    const sellerName = user
      ? `${user.first_name} ${user.last_name}`.trim() || user.username
      : "admin"
    const sellerPhone = user?.phone_number || "+998"

    const exchangeRate = saleData?.exchange_rate || "12500"
    const saleDate = saleData?.sale_date
      ? new Date(saleData.sale_date)
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(",", "")
      : new Date()
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(",", "")

    const clientName = saleData?.client?.full_name || "Test"
    const clientPhone = saleData?.client?.phone_number || "+9982222222222"

    const totalUzs = saleData?.debt_amounts?.total_amount?.uzs_amount || "0"
    const paidUzs = saleData?.debt_amounts?.paid_amount?.uzs_amount || "0"
    const paidUsd = saleData?.debt_amounts?.paid_amount?.usd_amount || "0"
    const remainingUzs = saleData?.debt_amounts?.remaining_amount?.uzs_amount || "0"
    const remainingUsd = saleData?.debt_amounts?.remaining_amount?.usd_amount || "0"

    const totalDebtUzs = parseFloat(oldDebts?.total_uzs || "0") + parseFloat(remainingUzs)
    const totalDebtUsd = parseFloat(oldDebts?.total_usd || "0") + parseFloat(remainingUsd)

    const items = saleData?.items?.length
      ? saleData.items
      : [{ id: 1, product: { name: "Yasin tea 41022 1kg", id: 0, cover_image: null, product_type: "" }, qty: 1, unit_price: "2000", subtotal: "2000" }]

    useEffect(() => {
      const generateAsciiCheque = (): string => {
        let output = ""

        output += padCenter("Savdo tizimi cheki", CHEQUE_WIDTH) + "\n"
        output += "\n"

        output += kvLine("Sotuvchi:", sellerName) + "\n"
        output += kvLine("Sotuvchi telefon raqami:", sellerPhone) + "\n"
        output += kvLine("Valyuta kursi:", formatNumber(exchangeRate)) + "\n"
        output += kvLine("Sana:", saleDate) + "\n"
        output += "\n"

        output += kvLine("Mijoz:", clientName) + "\n"
        output += kvLine("Mijoz telefon raqami:", clientPhone) + "\n"
        output += "\n"

        const nCol = 2
        const nameCol = 12
        const qtyCol = 4
        const priceCol = 8
        const sumCol = 10

        output += "┌" + "─".repeat(nCol) + "┬" + "─".repeat(nameCol) + "┬" + "─".repeat(qtyCol) + "┬" + "─".repeat(priceCol) + "┬" + "─".repeat(sumCol) + "┐\n"
        output += "│" + padCenter("N", nCol) + "│" + padCenter("Mahsulot nom", nameCol) + "│" + padCenter("Miqd", qtyCol) + "│" + padCenter("Narxi", priceCol) + "│" + padCenter("cheque.ta", sumCol) + "│\n"
        output += "├" + "─".repeat(nCol) + "┼" + "─".repeat(nameCol) + "┼" + "─".repeat(qtyCol) + "┼" + "─".repeat(priceCol) + "┼" + "─".repeat(sumCol) + "┤\n"

        items.forEach((item, index) => {
          const lines = splitByWidth(item.product.name || "-", nameCol)
          output += "│" + padLeft(String(index + 1), nCol)
          output += "│" + padRight(lines[0], nameCol)
          output += "│" + padLeft(String(item.qty), qtyCol)
          output += "│" + padLeft(formatNumber(item.unit_price), priceCol)
          output += "│" + padLeft(formatNumber(item.subtotal), sumCol) + "│\n"

          lines.slice(1).forEach((line) => {
            output += "│" + " ".repeat(nCol)
            output += "│" + padRight(line, nameCol)
            output += "│" + " ".repeat(qtyCol)
            output += "│" + " ".repeat(priceCol)
            output += "│" + " ".repeat(sumCol) + "│\n"
          })
        })

        output += "└" + "─".repeat(nCol) + "┴" + "─".repeat(nameCol) + "┴" + "─".repeat(qtyCol) + "┴" + "─".repeat(priceCol) + "┴" + "─".repeat(sumCol) + "┘\n"
        output += "\n"

        const totalUsd = parseFloat(exchangeRate) > 0
          ? formatUsd(parseFloat(totalUzs) / parseFloat(exchangeRate))
          : "0.00"

        output += kvLine("Jami summa so'mda:", formatNumber(totalUzs)) + "\n"
        output += kvLine("Jami summa dollarda", totalUsd) + "\n"
        output += "\n"

        output += kvLine("To'langan so'mda:", formatNumber(paidUzs)) + "\n"
        output += kvLine("To'langan dollarda", formatUsd(paidUsd)) + "\n"
        output += "\n"

        output += "─".repeat(CHEQUE_WIDTH) + "\n"
        output += kvLine("Eski qarz so'mda:", formatNumber(oldDebts?.total_uzs || "0")) + "\n"
        output += kvLine("Eski qarz dollarda", formatUsd(oldDebts?.total_usd || "0")) + "\n"
        output += "\n"

        output += kvLine("Yangi qarz so'mda:", formatNumber(remainingUzs)) + "\n"
        output += kvLine("Yangi qarz dollarda", formatUsd(remainingUsd)) + "\n"
        output += "\n"

        output += "─".repeat(CHEQUE_WIDTH) + "\n"
        output += kvLine("Jami qarz so'mda:", formatNumber(totalDebtUzs)) + "\n"
        output += kvLine("Jami qarz dollarda", formatUsd(totalDebtUsd)) + "\n"
        output += "\n"

        output += padCenter("XARIDINGIZ UCHUN RAHMAT", CHEQUE_WIDTH) + "\n"
        return output
      }

      setAsciiText(generateAsciiCheque())
    }, [
      sellerName,
      sellerPhone,
      exchangeRate,
      saleDate,
      clientName,
      clientPhone,
      totalUzs,
      paidUzs,
      paidUsd,
      remainingUzs,
      remainingUsd,
      totalDebtUzs,
      totalDebtUsd,
      oldDebts,
      items,
    ])

    useImperativeHandle(ref, () => ({
      getAsciiText: () => asciiText,
    }))

    if (isLoading) {
      return (
        <div className="bg-white text-black font-mono p-6">
          <div className="text-center py-4">Loading debts...</div>
        </div>
      )
    }

    return (
      <div className="bg-white text-black p-4">
        <pre className="font-mono text-xs whitespace-pre" style={{ fontFamily: "monospace" }}>
          {asciiText}
        </pre>
      </div>
    )
  }
)

ChequePreview.displayName = "ChequePreview"
