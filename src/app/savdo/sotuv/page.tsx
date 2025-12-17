"use client"

import { useTranslation } from "react-i18next"
import { ShoppingCart } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SotuvPage() {
  const { t } = useTranslation(['common'])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('navigation.sotuv')}</h1>
        <p className="text-muted-foreground">Sales and transactions management</p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-6">
              <ShoppingCart className="size-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
          <CardDescription>
            This feature is under development and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            The sales management system will allow you to create and manage sales transactions,
            track payments, and generate invoices.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
