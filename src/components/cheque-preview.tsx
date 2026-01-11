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

// Helper: Format a number with space as thousand separator
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 }).replace(/,/g, ' ')
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

    if (isLoading) {
      return (
        <div ref={ref} className="bg-white text-black font-mono p-6">
          <div className="text-center py-4">Loading debts...</div>
        </div>
      )
    }
    
    return (
      <div ref={ref} className="bg-white text-black font-mono p-4 text-xs">
        {/* Title */}
        <div className="text-center font-bold text-sm mb-3">
          {t("sales:cheque.title")}
        </div>

        {/* Seller Info */}
        <div className="flex justify-between mb-1">
          <span>{sellerName}</span>
          <span>{sellerPhone}</span>
        </div>

        {/* Exchange Rate & Date */}
        <div className="flex justify-between mb-3">
          <span>{t("sales:cheque.exchangeRate")} {formatNumber(exchangeRate)}</span>
          <span>{saleDate}</span>
        </div>

        {/* Client Section */}
        <div className="mb-2">
          <div className="font-semibold">{t("sales:cheque.client")}:</div>
          <div className="flex justify-between">
            <span>{clientName}</span>
            <span>{clientPhone}</span>
          </div>
        </div>

        {/* Products Table */}
        <table className="w-full border-collapse mb-3">
          <thead>
            <tr className="border-t border-b border-black">
              <th className="text-left py-1 pr-1 w-6">{t("sales:cheque.tableHeaders.n") || "№"}</th>
              <th className="text-left py-1 px-1">{t("sales:cheque.tableHeaders.productName") || "Товар"}</th>
              <th className="text-right py-1 px-1 w-12">{t("sales:cheque.tableHeaders.quantity") || "Кол"}</th>
              <th className="text-right py-1 px-1 w-20">{t("sales:cheque.tableHeaders.price") || "Цена"}</th>
              <th className="text-right py-1 pl-1 w-24">{t("sales:cheque.tableHeaders.sum") || "Сумма"}</th>
            </tr>
          </thead>
          <tbody>
            {items ? (
              items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-1 pr-1">{index + 1}</td>
                  <td className="py-1 px-1 truncate max-w-[120px]" title={item.product.name}>
                    {item.product.name}
                  </td>
                  <td className="text-right py-1 px-1">{item.qty}</td>
                  <td className="text-right py-1 px-1">{formatNumber(item.unit_price)}</td>
                  <td className="text-right py-1 pl-1">{formatNumber(item.subtotal)}</td>
                </tr>
              ))
            ) : (
              <>
                <tr className="border-b border-gray-300">
                  <td className="py-1 pr-1">1</td>
                  <td className="py-1 px-1">Product 1</td>
                  <td className="text-right py-1 px-1">2</td>
                  <td className="text-right py-1 px-1">3 000</td>
                  <td className="text-right py-1 pl-1">6 000</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-1 pr-1">2</td>
                  <td className="py-1 px-1">Product 2</td>
                  <td className="text-right py-1 px-1">4</td>
                  <td className="text-right py-1 px-1">2 000</td>
                  <td className="text-right py-1 pl-1">8 000</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* Total Sum */}
        <div className="flex justify-between font-semibold mb-2">
          <span>{t("sales:cheque.totalSumUZS") || "Товар сумма(СУМ):"}</span>
          <span>{formatNumber(totalUzs)}</span>
        </div>

        {/* Discount Section */}
        {hasDiscount && (
          <>
            <div className="flex justify-between">
              <span>{t("sales:cheque.discountInUZS")}</span>
              <span>{formatNumber(discountUzs)} so'm</span>
            </div>
            <div className="flex justify-between">
              <span>{t("sales:cheque.discountInUSD")}</span>
              <span>{discountUsd} $</span>
            </div>
            <div className="flex justify-between">
              <span>{t("sales:cheque.totalAfterDiscountInUZS")}</span>
              <span>{formatNumber(totalAfterDiscountUzs)} so'm</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t("sales:cheque.totalAfterDiscountInUSD")}</span>
              <span>{totalAfterDiscountUsd} $</span>
            </div>
          </>
        )}

        {/* Payment Section */}
        {saleData?.debt_amounts && (
          <>
            <div className="flex justify-between">
              <span>{t("sales:cheque.totalPaidInUZS")}</span>
              <span>{formatNumber(paidUzs)} so'm</span>
            </div>
            <div className="flex justify-between mb-3">
              <span>{t("sales:cheque.totalPaidInUSD")}</span>
              <span>{paidUsd} $</span>
            </div>
          </>
        )}

        {/* Thank You */}
        <div className="text-center font-semibold mb-2">
          {t("sales:cheque.thankYou")}
        </div>

        {/* Divider */}
        <div className="border-t border-black mb-2"></div>

        {/* Old Debts */}
        {hasOldDebts && (
          <>
            <div className="flex justify-between">
              <span>{t("sales:cheque.oldDebtInUZS")}</span>
              <span>{formatNumber(oldDebts.total_uzs)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t("sales:cheque.oldDebtInUSD")}</span>
              <span>{oldDebts.total_usd}</span>
            </div>
          </>
        )}

        {/* Debt from Current Sale */}
        {hasRemainingDebt && (
          <>
            <div className="border-t border-black mb-2"></div>
            <div className="flex justify-between">
              <span>{t("sales:cheque.debtFromSaleInUZS")}</span>
              <span>{formatNumber(remainingUzs)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t("sales:cheque.debtFromSaleInUSD")}</span>
              <span>{remainingUsd}</span>
            </div>

            {/* Total Current Debt */}
            <div className="border-t border-black mb-2"></div>
            <div className="flex justify-between font-semibold">
              <span>{t("sales:cheque.totalCurrentDebtInUZS")}</span>
              <span>{formatNumber(totalDebtUzs.toString())}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t("sales:cheque.totalCurrentDebtInUSD")}</span>
              <span>{totalDebtUsd.toFixed(2)}</span>
            </div>
          </>
        )}

        {/* Total Current Debt (only old debt exists) */}
        {!hasRemainingDebt && hasOldDebts && (
          <>
            <div className="border-t border-black mb-2"></div>
            <div className="flex justify-between font-semibold">
              <span>{t("sales:cheque.totalCurrentDebtInUZS")}</span>
              <span>{formatNumber(oldDebts.total_uzs)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t("sales:cheque.totalCurrentDebtInUSD")}</span>
              <span>{oldDebts.total_usd}</span>
            </div>
          </>
        )}
      </div>
    )
  }
)

ChequePreview.displayName = "ChequePreview"
