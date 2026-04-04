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

interface BuildChequeTextParams {
    saleData?: SaleDetail | null
    oldDebts?: OldDebtsForChequeResponse | null
    username?: string | null
}

const CHEQUE_PREVIEW_FONT_SIZE_REM = 0.70
const CHEQUE_PREVIEW_LINE_HEIGHT = 1.05

const formatNumber = (value: string | number): string => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num)) return "0"

    const hasDecimals = num % 1 !== 0
    const formatted = hasDecimals ? num.toFixed(2) : num.toFixed(0)
    const parts = formatted.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    return parts.join(".")
}

const formatUsd = (value: string | number, exchangeRate: string | number): string => {
    const amount = typeof value === "string" ? parseFloat(value) : value
    const rate = typeof exchangeRate === "string" ? parseFloat(exchangeRate) : exchangeRate

    if (isNaN(amount) || isNaN(rate) || rate <= 0) return "0.00"

    return (amount / rate).toFixed(2)
}

const padRight = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    return text + " ".repeat(width - text.length)
}

const padLeft = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    return " ".repeat(width - text.length) + text
}

const padCenter = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    const totalPad = width - text.length
    const leftPad = Math.floor(totalPad / 2)
    const rightPad = totalPad - leftPad
    return " ".repeat(leftPad) + text + " ".repeat(rightPad)
}

const wrapText = (text: string, width: number): string[] => {
    const normalized = (text || "").trim()
    if (!normalized) return [""]

    const words = normalized.split(/\s+/)
    const lines: string[] = []
    let current = ""

    for (const word of words) {
        if (word.length > width) {
            if (current) {
                lines.push(current)
                current = ""
            }

            for (let i = 0; i < word.length; i += width) {
                lines.push(word.slice(i, i + width))
            }
            continue
        }

        const next = current ? `${current} ${word}` : word
        if (next.length <= width) {
            current = next
        } else {
            lines.push(current)
            current = word
        }
    }

    if (current) {
        lines.push(current)
    }

    return lines.length > 0 ? lines : [""]
}

const buildHorizontalRule = (
    left: string,
    middle: string,
    right: string,
    widths: number[],
): string => `${left}${widths.map((width) => "─".repeat(width)).join(middle)}${right}\n`

export const buildChequeText = ({
    saleData,
    oldDebts,
    username,
}: BuildChequeTextParams): string => {
    const saleDateValue = saleData?.sale_date ? new Date(saleData.sale_date) : new Date()
    const saleDateOnly = saleDateValue.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
    const displayUsername = username || "admin"
    const exchangeRate = saleData?.exchange_rate || "1"

    const totalUzs = saleData?.debt_amounts?.total_amount?.uzs_amount || "0"
    const discountUzs = saleData?.debt_amounts?.discount_amount?.uzs_amount || "0"
    const paidUzs = saleData?.debt_amounts?.paid_amount?.uzs_amount || "0"
    const totalAfterDiscountUzs = saleData?.debt_amounts?.total_after_discount?.uzs_amount || "0"
    const remainingUzs = saleData?.debt_amounts?.remaining_amount?.uzs_amount || "0"

    const hasDiscount = parseFloat(discountUzs) > 0
    const hasOldDebts = !!oldDebts && (parseFloat(oldDebts.total_uzs) > 0 || parseFloat(oldDebts.total_usd) > 0)
    const hasRemainingDebt = parseFloat(remainingUzs) > 0
    const totalDebtUzs = parseFloat(oldDebts?.total_uzs || "0") + parseFloat(remainingUzs)
    const items = saleData?.items && saleData.items.length > 0 ? saleData.items : null

    const WIDTH = 45
    let output = ""

    const metaLabelWidth = 12
    const metaValueWidth = WIDTH - metaLabelWidth
    const pushMetaLine = (label: string, value: string) => {
        output += padRight(label, metaLabelWidth) + padLeft(value, metaValueWidth) + "\n"
    }

    pushMetaLine("Sana:", saleDateOnly)
    pushMetaLine("Ism:", displayUsername)
    pushMetaLine("Kurs:", formatNumber(exchangeRate))
    output += "\n"

    const nCol = 3
    const nameCol = 15
    const qtyCol = 4
    const priceCol = 7
    const sumCol = 10
    const columnWidths = [nCol, nameCol, qtyCol, priceCol, sumCol]

    output += buildHorizontalRule("┌", "┬", "┐", columnWidths)
    output += "│" + padCenter("ID", nCol) +
        "│" + padCenter("Nomi", nameCol) +
        "│" + padCenter("Soni", qtyCol) +
        "│" + padCenter("Narx", priceCol) +
        "│" + padCenter("Jami", sumCol) + "│\n"
    output += buildHorizontalRule("├", "┼", "┤", columnWidths)

    const itemsToDisplay = items || [
        { id: 1, product: { name: "Product 1" }, qty: 2, unit_price: "3000", subtotal: "6000" },
        { id: 2, product: { name: "Product 2" }, qty: 4, unit_price: "2000", subtotal: "8000" },
    ]

    itemsToDisplay.forEach((item, index) => {
        const itemName = items ? item.product.name : `Product ${index + 1}`
        const itemQty = items ? item.qty.toString() : "2"
        const itemPrice = formatNumber(item.unit_price)
        const itemSum = formatNumber(item.subtotal)

        const wrappedNameLines = wrapText(itemName, nameCol)
        wrappedNameLines.forEach((nameLine, lineIndex) => {
            output += "│" + padLeft(lineIndex === 0 ? (index + 1).toString() : "", nCol) +
                "│" + padRight(nameLine, nameCol) +
                "│" + padLeft(lineIndex === 0 ? itemQty : "", qtyCol) +
                "│" + padLeft(lineIndex === 0 ? itemPrice : "", priceCol) +
                "│" + padLeft(lineIndex === 0 ? itemSum : "", sumCol) + "│\n"
        })
    })

    output += buildHorizontalRule("└", "┴", "┘", columnWidths)
    output += "\n"

    output += padRight("Jami:", 12) + padLeft(`${formatNumber(totalUzs)} so'm`, WIDTH - 12) + "\n"

    if (hasDiscount) {
        output += "\n"
        output += padRight("Chegirma:", 20) + padLeft(`${formatNumber(discountUzs)} so'm`, WIDTH - 20) + "\n"
        output += padRight("Chegirmadan keyin:", 20) + padLeft(`${formatNumber(totalAfterDiscountUzs)} so'm`, WIDTH - 20) + "\n"
    }

    if (saleData?.debt_amounts) {
        output += "\n"
        output += padRight("To'landi:", 20) + padLeft(`${formatNumber(paidUzs)} so'm`, WIDTH - 20) + "\n"
    }

    if (hasOldDebts) {
        output += "\n"
        output += padRight("Eski qarz so'mda:", 20) + padLeft(`${formatNumber(oldDebts.total_uzs)} so'm`, WIDTH - 20) + "\n"
        output += padRight("Eski qarz dollarda:", 20) + padLeft(`${formatUsd(oldDebts.total_uzs, exchangeRate)} USD`, WIDTH - 20) + "\n"
    }

    if (hasRemainingDebt) {
        output += padRight("Ushbu sotuv qarzi so'mda:", 20) + padLeft(`${formatNumber(remainingUzs)} so'm`, WIDTH - 20) + "\n"
        output += padRight("Ushbu sotuv qarzi dollarda:", 20) + padLeft(`${formatUsd(remainingUzs, exchangeRate)} USD`, WIDTH - 20) + "\n"
        output += padRight("Jami qarz so'mda:", 20) + padLeft(`${formatNumber(totalDebtUzs.toString())} so'm`, WIDTH - 20) + "\n"
        output += padRight("Jami qarz dollarda:", 20) + padLeft(`${formatUsd(totalDebtUzs, exchangeRate)} USD`, WIDTH - 20) + "\n"
    }

    if (!hasRemainingDebt && hasOldDebts) {
        output += padRight("Jami qarz so'mda:", 20) + padLeft(`${formatNumber(oldDebts.total_uzs)} so'm`, WIDTH - 20) + "\n"
        output += padRight("Jami qarz dollarda:", 20) + padLeft(`${formatUsd(oldDebts.total_uzs, exchangeRate)} USD`, WIDTH - 20) + "\n"
    }

    output += "\n"
    output += padCenter("Tashrifingizdan mamnunmiz!", WIDTH) + "\n"

    return output
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

        const username = user?.username || "admin"

        useEffect(() => {
            const text = buildChequeText({
                saleData,
                oldDebts,
                username,
            })
            setAsciiText(text)
        }, [saleData, oldDebts, username])

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
                <pre
                    className="font-mono whitespace-pre"
                    style={{
                        fontFamily: "monospace",
                        fontSize: `${CHEQUE_PREVIEW_FONT_SIZE_REM}rem`,
                        lineHeight: CHEQUE_PREVIEW_LINE_HEIGHT,
                    }}
                >
                    {asciiText}
                </pre>
            </div>
        )
    },
)

ChequePreview.displayName = "ChequePreview"
