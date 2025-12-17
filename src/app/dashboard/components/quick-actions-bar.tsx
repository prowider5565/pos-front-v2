import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  PackageOpen, 
  Store, 
  Users, 
  UserPlus, 
  CreditCard,
  Wallet,
  FileText,
  ClipboardList
} from 'lucide-react'

export function QuickActionsBar() {
  const { t } = useTranslation('dashboard')
  
  const quickActions = [
    {
      icon: Package,
      labelKey: 'quickActions.addProduct',
      onClick: () => console.log('Add new product'),
    },
    {
      icon: PackageOpen,
      labelKey: 'quickActions.importBatch',
      onClick: () => console.log('Import new batch'),
    },
    {
      icon: Store,
      labelKey: 'quickActions.addSupplier',
      onClick: () => console.log('Add new supplier'),
    },
    {
      icon: Users,
      labelKey: 'quickActions.addClient',
      onClick: () => console.log('Add new client'),
    },
    {
      icon: UserPlus,
      labelKey: 'quickActions.addStaff',
      onClick: () => console.log('Add new staff'),
    },
    {
      icon: Wallet,
      labelKey: 'quickActions.payClientDebt',
      onClick: () => console.log('Pay client debt'),
    },
    {
      icon: CreditCard,
      labelKey: 'quickActions.paySupplierDebt',
      onClick: () => console.log('Pay supplier debt'),
    },
    {
      icon: FileText,
      labelKey: 'quickActions.addOldClientDebt',
      onClick: () => console.log('Add old client debt'),
    },
    {
      icon: ClipboardList,
      labelKey: 'quickActions.addOldSellerDebt',
      onClick: () => console.log('Add old seller debt'),
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('quickActions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-8 w-8" />
                <span className="text-center text-xs font-medium leading-tight">
                  {t(action.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
