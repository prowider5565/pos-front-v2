import { forwardRef, useEffect, useState, useImperativeHandle } from "react"
import { useTranslation } from "react-i18next"
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

export const ChequePreview = forwardRef<ChequePreviewHandle, ChequePreviewProps>(
  ({ saleData, oldDebts: providedOldDebts }, ref) => {
    const { t } = useTranslation()
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

    // Get seller info from current user
    const sellerName = user 
      ? `${user.first_name} ${user.last_name}`.trim() || user.username
      : "Store Seller"
    const sellerPhone = user?.phone_number || "+998991234567"
    
    const exchangeRate = saleData?.exchange_rate || "12500"
    const saleDate = saleData?.sale_date 
      ? new Date(saleData.sale_date).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', '')
      : new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric', 
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', '')
    
    const clientName = saleData?.client?.full_name || "Walk-in Customer"
    const clientPhone = saleData?.client?.phone_number || "-"

    // Get amounts
    const totalUzs = saleData?.debt_amounts?.total_amount?.uzs_amount || "0"
    const discountUzs = saleData?.debt_amounts?.discount_amount?.uzs_amount || "0"
    const discountUsd = saleData?.debt_amounts?.discount_amount?.usd_amount || "0"
    const paidUzs = saleData?.debt_amounts?.paid_amount?.uzs_amount || "0"
    const paidUsd = saleData?.debt_amounts?.paid_amount?.usd_amount || "0"
    const totalAfterDiscountUzs = saleData?.debt_amounts?.total_after_discount?.uzs_amount || "0"
    const totalAfterDiscountUsd = saleData?.debt_amounts?.total_after_discount?.usd_amount || "0"
    const remainingUzs = saleData?.debt_amounts?.remaining_amount?.uzs_amount || "0"
    const remainingUsd = saleData?.debt_amounts?.remaining_amount?.usd_amount || "0"

    const hasDiscount = parseFloat(discountUzs) > 0
    const hasOldDebts = oldDebts && (parseFloat(oldDebts.total_uzs) > 0 || parseFloat(oldDebts.total_usd) > 0)
    const hasRemainingDebt = parseFloat(remainingUzs) > 0

    // Calculate total current debt
    const totalDebtUzs = parseFloat(oldDebts?.total_uzs || "0") + parseFloat(remainingUzs)
    const totalDebtUsd = parseFloat(oldDebts?.total_usd || "0") + parseFloat(remainingUsd)

    // Items to display
    const items = saleData?.items && saleData.items.length > 0 
      ? saleData.items 
      : null

    // Generate ASCII table text
    useEffect(() => {
      const generateAsciiCheque = (): string => {
        const WIDTH = 38 // Total width for thermal printer (accounting for notepad margins)
        let output = ''

        // Title (centered)
        const title = t("sales:cheque.title")
        output += padCenter(title, WIDTH) + '\n'
        output += '\n'

        // Seller info
        output += padRight(sellerName, WIDTH) + '\n'
        output += padRight(sellerPhone, WIDTH) + '\n'
        
        // Exchange rate and date
        const exchangeRateLine = `${t("sales:cheque.exchangeRate")} ${formatNumber(exchangeRate)}`
        output += padRight(exchangeRateLine, WIDTH) + '\n'
        output += padRight(saleDate, WIDTH) + '\n'
        output += '\n'

        // Client section
        output += padRight(`${t("sales:cheque.client")}:`, WIDTH) + '\n'
        output += padRight(clientName, WIDTH) + '\n'
        output += padRight(clientPhone, WIDTH) + '\n'
        output += '\n'

        // Products table with borders (total width = 38)
        const nCol = 2    // № column
        const nameCol = 11 // Product name column
        const qtyCol = 3  // Quantity column
        const priceCol = 8 // Price column
        const sumCol = 9  // Sum column
        // Total: 2+11+3+8+9 = 33 + 5 separators = 38 chars

        // Table top border (ASCII: asterisk and dash)
        output += '*' + '-'.repeat(nCol) + '*' + '-'.repeat(nameCol) + '*' + 
                  '-'.repeat(qtyCol) + '*' + '-'.repeat(priceCol) + '*' + 
                  '-'.repeat(sumCol) + '*\n'

        // Table headers
        output += '|' + padCenter(t("sales:cheque.tableHeaders.n") || "N", nCol) + 
                  '|' + padCenter(t("sales:cheque.tableHeaders.productName") || "Product", nameCol) +
                  '|' + padCenter(t("sales:cheque.tableHeaders.quantity") || "Qty", qtyCol) +
                  '|' + padCenter(t("sales:cheque.tableHeaders.price") || "Price", priceCol) +
                  '|' + padCenter(t("sales:cheque.tableHeaders.sum") || "Sum", sumCol) + '|\n'

        // Header separator
        output += '*' + '-'.repeat(nCol) + '*' + '-'.repeat(nameCol) + '*' + 
                  '-'.repeat(qtyCol) + '*' + '-'.repeat(priceCol) + '*' + 
                  '-'.repeat(sumCol) + '*\n'

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

          output += '|' + padLeft((index + 1).toString(), nCol) +
                    '|' + padRight(itemName.substring(0, nameCol), nameCol) +
                    '|' + padLeft(itemQty, qtyCol) +
                    '|' + padLeft(itemPrice, priceCol) +
                    '|' + padLeft(itemSum, sumCol) + '|\n'
        })

        // Table bottom border (ASCII: asterisk and dash)
        output += '*' + '-'.repeat(nCol) + '*' + '-'.repeat(nameCol) + '*' + 
                  '-'.repeat(qtyCol) + '*' + '-'.repeat(priceCol) + '*' + 
                  '-'.repeat(sumCol) + '*\n'
        output += '\n'

        // Total sum (UZS and USD on separate lines)
        const totalLabel = t("sales:cheque.totalSum") || "Product sum:"
        output += padRight(totalLabel, WIDTH) + '\n'
        output += padRight('  UZS:', 14) + padLeft(formatNumber(totalUzs), 24) + '\n'
        const totalUsd = (parseFloat(totalUzs) / parseFloat(exchangeRate)).toFixed(2)
        output += padRight('  USD:', 14) + padLeft(totalUsd, 24) + '\n'

        // Discount section (if applicable)
        if (hasDiscount) {
          output += '\n'
          output += padRight(t("sales:cheque.discount") || "Discount:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(discountUzs), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(discountUsd, 24) + '\n'
          
          output += '\n'
          output += padRight(t("sales:cheque.totalAfterDiscount") || "After discount:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(totalAfterDiscountUzs), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(totalAfterDiscountUsd, 24) + '\n'
        }

        // Payment section
        if (saleData?.debt_amounts) {
          output += '\n'
          output += padRight(t("sales:cheque.totalPaid") || "Paid:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(paidUzs), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(paidUsd, 24) + '\n'
        }
        output += '\n'

        // Thank you
        output += padCenter(t("sales:cheque.thankYou"), WIDTH) + '\n'
        output += '='.repeat(WIDTH) + '\n'

        // Old debts
        if (hasOldDebts) {
          output += padRight(t("sales:cheque.oldDebt") || "Old debt:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(oldDebts.total_uzs), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(oldDebts.total_usd, 24) + '\n'
        }

        // Debt from current sale
        if (hasRemainingDebt) {
          output += '\n'
          output += padRight(t("sales:cheque.debtFromSale") || "Debt from sale:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(remainingUzs), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(remainingUsd, 24) + '\n'
          
          // Total current debt
          output += '\n'
          output += '='.repeat(WIDTH) + '\n'
          output += padRight(t("sales:cheque.totalCurrentDebt") || "Total debt:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(totalDebtUzs.toString()), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(totalDebtUsd.toFixed(2), 24) + '\n'
        }

        // Total current debt (only old debt exists)
        if (!hasRemainingDebt && hasOldDebts) {
          output += '\n'
          output += '='.repeat(WIDTH) + '\n'
          output += padRight(t("sales:cheque.totalCurrentDebt") || "Total debt:", WIDTH) + '\n'
          output += padRight('  UZS:', 14) + padLeft(formatNumber(oldDebts.total_uzs), 24) + '\n'
          output += padRight('  USD:', 14) + padLeft(oldDebts.total_usd, 24) + '\n'
        }

        return output
      }

      const text = generateAsciiCheque()
      setAsciiText(text)
    }, [saleData, oldDebts, t, sellerName, sellerPhone, exchangeRate, saleDate, clientName, clientPhone,
        totalUzs, discountUzs, discountUsd, paidUzs, paidUsd, totalAfterDiscountUzs, totalAfterDiscountUsd,
        remainingUzs, remainingUsd, hasDiscount, hasOldDebts, hasRemainingDebt, totalDebtUzs, totalDebtUsd, items])

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
