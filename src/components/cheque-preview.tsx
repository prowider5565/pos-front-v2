import { forwardRef, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/contexts/auth-context"
import { debtsService } from "@/services/debts.service"
import type { SaleDetail } from "@/types/sales"
import type { OldDebtsForChequeResponse } from "@/types/debts"

interface ChequePreviewProps {
  saleData?: SaleDetail | null
  oldDebts?: OldDebtsForChequeResponse | null
}

const formatReceiptText = (t: any, saleData?: SaleDetail | null, currentUser?: any, oldDebts?: OldDebtsForChequeResponse | null): string => {
  const width = 40 // Width for 80mm receipt (narrower)
  let receipt = ""
  
  // Get seller info from current user
  const sellerName = currentUser 
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username
    : "Store Seller"
  const sellerPhone = currentUser?.phone_number || "+998991234567"
  
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
  
  // Title - centered
  receipt += "\n"
  receipt += centerText(t("sales:cheque.title"), width) + "\n"
  receipt += "\n"
  
  // Seller Section
  receipt += t("sales:cheque.seller") + "\n"
  receipt += formatKeyValue(t("sales:cheque.fullName"), sellerName, width) + "\n"
  receipt += formatKeyValue(t("sales:cheque.phoneNumber"), sellerPhone, width) + "\n"
  receipt += formatKeyValue(t("sales:cheque.exchangeRate"), formatNumber(exchangeRate), width) + "\n"
  receipt += formatKeyValue(t("sales:cheque.date"), saleDate, width) + "\n"
  receipt += "\n"
  
  // Client Section  
  receipt += t("sales:cheque.client") + "\n"
  receipt += formatKeyValue(t("sales:cheque.fullName"), clientName, width) + "\n"
  receipt += formatKeyValue(t("sales:cheque.phoneNumber"), clientPhone, width) + "\n"
  receipt += "\n"
  
  // Table with CP437 box-drawing borders
  receipt += formatTableTopBorder() + "\n"
  receipt += formatTableHeaderRow(t) + "\n"
  receipt += formatTableMiddleBorder() + "\n"
  
  // Product Rows - dynamic from saleData
  if (saleData && saleData.items && saleData.items.length > 0) {
    saleData.items.forEach((item, index) => {
      const totalUzs = item.subtotal
      const totalUsd = (parseFloat(item.subtotal) / parseFloat(exchangeRate)).toFixed(2)
      
      receipt += formatTableDataRow(
        (index + 1).toString(),
        item.product.name,
        item.qty.toString(),
        formatNumber(item.unit_price),
        formatNumber(totalUzs),
        totalUsd
      ) + "\n"
    })
  } else {
    // Fallback test data
    receipt += formatTableDataRow("1", "Product 1", "2", "3000", "6000", "0.48") + "\n"
    receipt += formatTableDataRow("2", "Product 2", "4", "2000", "8000", "0.64") + "\n"
  }
  
  // Total row
  const totalUzs = saleData?.debt_amounts?.total_amount?.uzs_amount || "0"
  const totalUsd = saleData?.debt_amounts?.total_amount?.usd_amount || "0"
  
  receipt += formatTableMiddleBorder() + "\n"
  receipt += formatTableTotalRow(formatNumber(totalUzs), totalUsd) + "\n"
  receipt += formatTableBottomBorder() + "\n"
  receipt += "\n"
  
  // Payment Summary Section
  if (saleData?.debt_amounts) {
    const discountUzs = saleData.debt_amounts.discount_amount.uzs_amount
    const discountUsd = saleData.debt_amounts.discount_amount.usd_amount
    const paidUzs = saleData.debt_amounts.paid_amount.uzs_amount
    const paidUsd = saleData.debt_amounts.paid_amount.usd_amount
    const totalAfterDiscountUzs = saleData.debt_amounts.total_after_discount.uzs_amount
    const totalAfterDiscountUsd = saleData.debt_amounts.total_after_discount.usd_amount
    const remainingUzs = saleData.debt_amounts.remaining_amount.uzs_amount
    const remainingUsd = saleData.debt_amounts.remaining_amount.usd_amount
    
    // Show discount if it exists
    if (parseFloat(discountUzs) > 0) {
      receipt += formatKeyValue(t("sales:cheque.discountInUZS"), formatNumber(discountUzs) + " so'm", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.discountInUSD"), discountUsd + " $", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.totalAfterDiscountInUZS"), formatNumber(totalAfterDiscountUzs) + " so'm", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.totalAfterDiscountInUSD"), totalAfterDiscountUsd + " $", width) + "\n"
      receipt += "\n"
    }
    
    // Show total payment made
    receipt += formatKeyValue(t("sales:cheque.totalPaidInUZS"), formatNumber(paidUzs) + " so'm", width) + "\n"
    receipt += formatKeyValue(t("sales:cheque.totalPaidInUSD"), paidUsd + " $", width) + "\n"
    receipt += "\n"
    
    // Debt Information Section
    receipt += "========================================\n"
    receipt += centerText(t("sales:cheque.debtInformation"), width) + "\n"
    receipt += "========================================\n"
    receipt += "\n"
    
    // Show old debts if they exist
    if (oldDebts && (parseFloat(oldDebts.total_uzs) > 0 || parseFloat(oldDebts.total_usd) > 0)) {
      receipt += formatKeyValue(t("sales:cheque.oldDebtInUZS"), formatNumber(oldDebts.total_uzs) + " so'm", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.oldDebtInUSD"), oldDebts.total_usd + " $", width) + "\n"
      receipt += "\n"
    }
    
    // Show debt from current sale if exists
    if (parseFloat(remainingUzs) > 0) {
      receipt += formatKeyValue(t("sales:cheque.debtFromSaleInUZS"), formatNumber(remainingUzs) + " so'm", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.debtFromSaleInUSD"), remainingUsd + " $", width) + "\n"
      receipt += "\n"
      
      // Calculate and show total current debt (old + new)
      const totalDebtUzs = parseFloat(oldDebts?.total_uzs || "0") + parseFloat(remainingUzs)
      const totalDebtUsd = parseFloat(oldDebts?.total_usd || "0") + parseFloat(remainingUsd)
      
      receipt += formatKeyValue(t("sales:cheque.totalCurrentDebtInUZS"), formatNumber(totalDebtUzs.toString()) + " so'm", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.totalCurrentDebtInUSD"), totalDebtUsd.toFixed(2) + " $", width) + "\n"
      receipt += "\n"
    } else if (oldDebts && (parseFloat(oldDebts.total_uzs) > 0 || parseFloat(oldDebts.total_usd) > 0)) {
      // Only old debt exists, show it as total current debt
      receipt += formatKeyValue(t("sales:cheque.totalCurrentDebtInUZS"), formatNumber(oldDebts.total_uzs) + " so'm", width) + "\n"
      receipt += formatKeyValue(t("sales:cheque.totalCurrentDebtInUSD"), oldDebts.total_usd + " $", width) + "\n"
      receipt += "\n"
    }
  }
  
  // Thank you message - centered
  receipt += centerText(t("sales:cheque.thankYou"), width) + "\n"
  receipt += "\n"
  
  return receipt
}

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2))
  return " ".repeat(padding) + text
}

const formatKeyValue = (key: string, value: string, width: number): string => {
  const spacing = width - key.length - value.length
  return key + " ".repeat(Math.max(1, spacing)) + value
}

// CP437 Box-Drawing Characters (will be converted to hex by Rust)
// ┌ = 0xDA (top-left corner)
// ─ = 0xC4 (horizontal line)
// ┬ = 0xC2 (top T junction)
// ┐ = 0xBF (top-right corner)
// ├ = 0xC3 (left T junction)
// ┼ = 0xC5 (cross/intersection)
// ┤ = 0xB4 (right T junction)
// └ = 0xC0 (bottom-left corner)
// ┴ = 0xC1 (bottom T junction)
// ┘ = 0xD9 (bottom-right corner)
// │ = 0xB3 (vertical line)

const formatTableTopBorder = (): string => {
  // Table width should match the width value (40 chars total for alignment)
  return "┌─┬──────────┬─────┬──────┬────────┬──────┐"
}

const formatTableMiddleBorder = (): string => {
  return "├─┼──────────┼─────┼──────┼────────┼──────┤"
}

const formatTableBottomBorder = (): string => {
  return "└─┴──────────┴─────┴──────┴────────┴──────┘"
}

const formatTableHeaderRow = (t: any): string => {
  const n = t("sales:cheque.tableHeaders.n")
  const productName = t("sales:cheque.tableHeaders.productName")
  const quantity = t("sales:cheque.tableHeaders.quantity")
  const price = t("sales:cheque.tableHeaders.price")
  const totalPriceUZS = "UZS" // Shortened
  const totalPriceUSD = "USD" // Shortened
  
  // Total width = 42 characters to align with right edge
  let header = "│" + n.padEnd(1) + "│"
  header += productName.substring(0, 10).padEnd(10) + "│"
  header += quantity.substring(0, 5).padEnd(5) + "│"
  header += price.substring(0, 6).padEnd(6) + "│"
  header += totalPriceUZS.padEnd(8) + "│"
  header += totalPriceUSD.padEnd(6) + "│"
  
  return header
}

const formatTableDataRow = (n: string, product: string, qty: string, price: string, totalUzs: string, totalUsd: string): string => {
  // Truncate product name if too long
  const productShort = product.length > 10 ? product.substring(0, 10) : product
  
  let row = "│" + n.padEnd(1) + "│"
  row += productShort.padEnd(10) + "│"
  row += qty.padEnd(5) + "│"
  row += price.padEnd(6) + "│"
  row += totalUzs.padEnd(8) + "│"
  row += totalUsd.padEnd(6) + "│"
  return row
}

const formatTableTotalRow = (totalUzs: string, totalUsd: string): string => {
  const label = "Total:"
  let row = "│ │"
  row += label.padEnd(10) + "│"
  row += " ".padEnd(5) + "│"
  row += " ".padEnd(6) + "│"
  row += totalUzs.padEnd(8) + "│"
  row += totalUsd.padEnd(6) + "│"
  return row
}

export const ChequePreview = forwardRef<HTMLDivElement, ChequePreviewProps>(
  ({ saleData, oldDebts: providedOldDebts }, ref) => {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [oldDebts, setOldDebts] = useState<OldDebtsForChequeResponse | null>(providedOldDebts || null)
    const [isLoading, setIsLoading] = useState(false)

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

    const receiptText = formatReceiptText(t, saleData, user, oldDebts)
    
    return (
      <div ref={ref} className="bg-white text-black font-mono p-6">
        {isLoading ? (
          <div className="text-center py-4">Loading debts...</div>
        ) : (
          <pre className="whitespace-pre font-mono text-[10px] leading-tight tracking-tight">
            {receiptText}
          </pre>
        )}
      </div>
    )
  }
)

ChequePreview.displayName = "ChequePreview"
