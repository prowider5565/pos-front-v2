import { forwardRef, useEffect, useState, useImperativeHandle } from "react"
import { useAuth } from "@/contexts/auth-context"
import { debtsService } from "@/services/debts.service"
import type { SaleDetail } from "@/types/sales"
import type { OldDebtsForChequeResponse } from "@/types/debts"

interface ChequePreviewProps {
    saleData?: SaleDetail | null
    oldDebts?: OldDebtsForChequeResponse | null
}

export interface ChequePreviewHandle {
    getAsciiText: () => string
}

// Helper: Format a number with comma as thousand separator (ASCII-safe)
const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'

    // Format with 2 decimal places if it's a decimal number, otherwise no decimals
    const hasDecimals = num % 1 !== 0
    const formatted = hasDecimals ? num.toFixed(2) : num.toFixed(0)

    // Add comma separators (ASCII-safe, no special characters)
    const parts = formatted.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return parts.join('.')
}

// Helper: Pad text to specified width
const padRight = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    return text + ' '.repeat(width - text.length)
}

const padLeft = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    return ' '.repeat(width - text.length) + text
}

const padCenter = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    const totalPad = width - text.length
    const leftPad = Math.floor(totalPad / 2)
    const rightPad = totalPad - leftPad
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
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

const formatUsd = (value: string | number, exchangeRate: string | number): string => {
    const amount = typeof value === 'string' ? parseFloat(value) : value
    const rate = typeof exchangeRate === 'string' ? parseFloat(exchangeRate) : exchangeRate

    if (isNaN(amount) || isNaN(rate) || rate <= 0) return '0.00'

    return (amount / rate).toFixed(2)
}

export const ChequePreview = forwardRef<ChequePreviewHandle, ChequePreviewProps>(
    ({ saleData, oldDebts: providedOldDebts }, ref) => {
        const { user } = useAuth()
        const [oldDebts, setOldDebts] = useState<OldDebtsForChequeResponse | null>(providedOldDebts || null)
        const [isLoading, setIsLoading] = useState(false)
        const [asciiText, setAsciiText] = useState<string>("")

        // Fetch old debts if not provided and client exists
        useEffect(() => {
            const fetchOldDebts = async () => {
                if (!providedOldDebts && saleData?.client?.id) {
                    setIsLoading(true)
                    try {
                        const debts = await debtsService.getOldDebtsForCheque(saleData.client.id)
                        setOldDebts(debts)
                    } catch (error) {
                        console.error('Failed to fetch old debts for cheque:', error)
                        // Set empty debts on error
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

        const saleDateValue = saleData?.sale_date ? new Date(saleData.sale_date) : new Date()
        const saleDateOnly = saleDateValue.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
        const username = user?.username || "admin"
        const exchangeRate = saleData?.exchange_rate || "1"

        // Get amounts
        const totalUzs = saleData?.debt_amounts?.total_amount?.uzs_amount || "0"
        const discountUzs = saleData?.debt_amounts?.discount_amount?.uzs_amount || "0"
        const paidUzs = saleData?.debt_amounts?.paid_amount?.uzs_amount || "0"
        const totalAfterDiscountUzs = saleData?.debt_amounts?.total_after_discount?.uzs_amount || "0"
        const remainingUzs = saleData?.debt_amounts?.remaining_amount?.uzs_amount || "0"

        const hasDiscount = parseFloat(discountUzs) > 0
        const hasOldDebts = oldDebts && (parseFloat(oldDebts.total_uzs) > 0 || parseFloat(oldDebts.total_usd) > 0)
        const hasRemainingDebt = parseFloat(remainingUzs) > 0

        // Calculate total current debt
        const totalDebtUzs = parseFloat(oldDebts?.total_uzs || "0") + parseFloat(remainingUzs)

        // Items to display
        const items = saleData?.items && saleData.items.length > 0
            ? saleData.items
            : null

        // Generate ASCII table text
        useEffect(() => {
            const generateAsciiCheque = (): string => {
                const WIDTH = 45 // Slightly wider layout for thermal printer content
                let output = ''

                const metaLabelWidth = 12
                const metaValueWidth = WIDTH - metaLabelWidth
                const pushMetaLine = (label: string, value: string) => {
                    output += padRight(label, metaLabelWidth) + padLeft(value, metaValueWidth) + '\n'
                }

                pushMetaLine("Sana:", saleDateOnly)
                pushMetaLine("Ism:", username)
                output += '\n'

                const nCol = 3
                const nameCol = 17
                const qtyCol = 4
                const priceCol = 7
                const sumCol = 8

                output += '┌' + '─'.repeat(nCol) + '┬' + '─'.repeat(nameCol) + '┬' +
                    '─'.repeat(qtyCol) + '┬' + '─'.repeat(priceCol) + '┬' +
                    '─'.repeat(sumCol) + '┐\n'
                output += '│' + padCenter("ID", nCol) +
                    '│' + padCenter("Nomi", nameCol) +
                    '│' + padCenter("Soni", qtyCol) +
                    '│' + padCenter("Narx", priceCol) +
                    '│' + padCenter("Jami", sumCol) + '│\n'
                output += '├' + '─'.repeat(nCol) + '┼' + '─'.repeat(nameCol) + '┼' +
                    '─'.repeat(qtyCol) + '┼' + '─'.repeat(priceCol) + '┼' +
                    '─'.repeat(sumCol) + '┤\n'

                // Table rows
                const itemsToDisplay = items || [
                    { id: 1, product: { name: 'Product 1' }, qty: 2, unit_price: '3000', subtotal: '6000' },
                    { id: 2, product: { name: 'Product 2' }, qty: 4, unit_price: '2000', subtotal: '8000' }
                ]

                itemsToDisplay.forEach((item, index) => {
                    const itemName = items ? item.product.name : `Product ${index + 1}`
                    const itemQty = items ? item.qty.toString() : '2'
                    const itemPrice = formatNumber(item.unit_price)
                    const itemSum = formatNumber(item.subtotal)

                    const wrappedNameLines = wrapText(itemName, nameCol)
                    wrappedNameLines.forEach((nameLine, lineIndex) => {
                        output += '│' + padLeft(lineIndex === 0 ? (index + 1).toString() : '', nCol) +
                            '│' + padRight(nameLine, nameCol) +
                            '│' + padLeft(lineIndex === 0 ? itemQty : '', qtyCol) +
                            '│' + padLeft(lineIndex === 0 ? itemPrice : '', priceCol) +
                            '│' + padLeft(lineIndex === 0 ? itemSum : '', sumCol) + '│\n'
                    })
                })

                output += '└' + '─'.repeat(nCol) + '┴' + '─'.repeat(nameCol) + '┴' +
                    '─'.repeat(qtyCol) + '┴' + '─'.repeat(priceCol) + '┴' +
                    '─'.repeat(sumCol) + '┘\n'
                output += '\n'

                output += padRight("Jami:", 12) + padLeft(`${formatNumber(totalUzs)} so'm`, WIDTH - 12) + '\n'

                if (hasDiscount) {
                    output += '\n'
                    output += padRight("Chegirma:", 20) + padLeft(`${formatNumber(discountUzs)} so'm`, WIDTH - 20) + '\n'
                    output += padRight("Chegirmadan keyin:", 20) + padLeft(`${formatNumber(totalAfterDiscountUzs)} so'm`, WIDTH - 20) + '\n'
                }

                if (saleData?.debt_amounts) {
                    output += '\n'
                    output += padRight("To'landi:", 20) + padLeft(`${formatNumber(paidUzs)} so'm`, WIDTH - 20) + '\n'
                }

                if (hasOldDebts) {
                    output += '\n'
                    output += padRight("Eski qarz so'mda:", 20) + padLeft(`${formatNumber(oldDebts.total_uzs)} so'm`, WIDTH - 20) + '\n'
                    output += padRight("Eski qarz dollarda:", 20) + padLeft(`${formatUsd(oldDebts.total_uzs, exchangeRate)} USD`, WIDTH - 20) + '\n'
                }

                if (hasRemainingDebt) {
                    output += padRight("Ushbu sotuv qarzi so'mda:", 20) + padLeft(`${formatNumber(remainingUzs)} so'm`, WIDTH - 20) + '\n'
                    output += padRight("Ushbu sotuv qarzi dollarda:", 20) + padLeft(`${formatUsd(remainingUzs, exchangeRate)} USD`, WIDTH - 20) + '\n'

                    output += padRight("Jami qarz so'mda:", 20) + padLeft(`${formatNumber(totalDebtUzs.toString())} so'm`, WIDTH - 20) + '\n'
                    output += padRight("Jami qarz dollarda:", 20) + padLeft(`${formatUsd(totalDebtUzs, exchangeRate)} USD`, WIDTH - 20) + '\n'
                }

                if (!hasRemainingDebt && hasOldDebts) {
                    output += padRight("Jami qarz so'mda:", 20) + padLeft(`${formatNumber(oldDebts.total_uzs)} so'm`, WIDTH - 20) + '\n'
                    output += padRight("Jami qarz dollarda:", 20) + padLeft(`${formatUsd(oldDebts.total_uzs, exchangeRate)} USD`, WIDTH - 20) + '\n'
                }

                output += '\n'
                output += padCenter("Tashrifingizdan mamnunmiz!", WIDTH) + '\n'

                return output
            }

            const text = generateAsciiCheque()
            setAsciiText(text)
        }, [saleData, oldDebts, saleDateOnly, username, exchangeRate,
            totalUzs, discountUzs, paidUzs, totalAfterDiscountUzs,
            remainingUzs, hasDiscount, hasOldDebts, hasRemainingDebt, totalDebtUzs, items])

        // Expose getAsciiText method via ref
        useImperativeHandle(ref, () => ({
            getAsciiText: () => asciiText
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
                <pre className="font-mono text-xs whitespace-pre" style={{ fontFamily: 'monospace' }}>
                    {asciiText}
                </pre>
            </div>
        )
    }
)

ChequePreview.displayName = "ChequePreview"
