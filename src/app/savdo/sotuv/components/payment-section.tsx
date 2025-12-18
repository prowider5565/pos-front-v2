"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Banknote, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentList } from "./payment-list"
import type { PaymentEntry, PaymentMethod, Currency } from "@/types/sales"

interface PaymentSectionProps {
  payments: PaymentEntry[]
  total: number
  exchangeRate: number
  onAddPayment: (method: string, currency: string, amount: string) => void
  onRemovePayment: (paymentId: string) => void
  onAddFullPayment: (method: string, currency: string) => void
}

export function PaymentSection({
  payments,
  total,
  exchangeRate,
  onAddPayment,
  onRemovePayment,
  onAddFullPayment,
}: PaymentSectionProps) {
  const { t } = useTranslation('sales')
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('UZS')
  const [paymentAmount, setPaymentAmount] = useState('')

  const handleAddPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return
    }
    
    onAddPayment(paymentMethod, paymentCurrency, paymentAmount)
    setPaymentAmount('')
  }

  const handleQuickPayment = (method: PaymentMethod, currency: Currency) => {
    onAddFullPayment(method, currency)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">{t('payment.title')}</h3>
        
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPayment('CASH', 'UZS')}
            className="flex items-center gap-2"
          >
            <Banknote className="h-4 w-4" />
            <span className="text-xs">{t('payment.fullCashUZS')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPayment('CASH', 'USD')}
            className="flex items-center gap-2"
          >
            <Banknote className="h-4 w-4" />
            <span className="text-xs">{t('payment.fullCashUSD')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPayment('CARD', 'UZS')}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-xs">{t('payment.fullCardUZS')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPayment('CARD', 'USD')}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-xs">{t('payment.fullCardUSD')}</span>
          </Button>
        </div>

        {/* Manual Payment Form */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('payment.method')}</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{t('payment.methods.CASH')}</SelectItem>
                    <SelectItem value="CARD">{t('payment.methods.CARD')}</SelectItem>
                    <SelectItem value="BANK_TRANSFER">{t('payment.methods.BANK_TRANSFER')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs">{t('payment.currency')}</Label>
                <Select value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as Currency)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UZS">UZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('payment.amount')}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-9"
                />
                <Button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('payment.addPayment')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment List */}
        <div className="mt-3">
          <PaymentList
            payments={payments}
            exchangeRate={exchangeRate}
            onRemovePayment={onRemovePayment}
          />
        </div>
      </div>
    </div>
  )
}
