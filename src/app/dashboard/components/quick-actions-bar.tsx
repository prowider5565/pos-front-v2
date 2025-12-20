import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
import { ProductCreateDialog } from '@/app/products/components/product-create-dialog'
import { ClientFormDialog } from '@/app/clients/components/client-form-dialog'
import { BatchImportDialog } from '@/components/batch-import-dialog'

export function QuickActionsBar() {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [batchImportDialogOpen, setBatchImportDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  
  const quickActions = [
    {
      icon: Package,
      labelKey: 'quickActions.addProduct',
      onClick: () => setProductDialogOpen(true),
    },
    {
      icon: PackageOpen,
      labelKey: 'quickActions.importBatch',
      onClick: () => setBatchImportDialogOpen(true),
    },
    {
      icon: Store,
      labelKey: 'quickActions.addSupplier',
      onClick: () => navigate('/suppliers?openModal=true'),
    },
    {
      icon: Users,
      labelKey: 'quickActions.addClient',
      onClick: () => setClientDialogOpen(true),
    },
    {
      icon: UserPlus,
      labelKey: 'quickActions.addStaff',
      onClick: () => navigate('/users?openModal=true'),
    },
    {
      icon: Wallet,
      labelKey: 'quickActions.payClientDebt',
      onClick: () => navigate('/debts/clients?tab=sale'),
    },
    {
      icon: CreditCard,
      labelKey: 'quickActions.paySupplierDebt',
      onClick: () => navigate('/debts/suppliers?tab=new'),
    },
    {
      icon: FileText,
      labelKey: 'quickActions.addOldClientDebt',
      onClick: () => navigate('/debts/clients?tab=old&openModal=true'),
    },
    {
      icon: ClipboardList,
      labelKey: 'quickActions.addOldSellerDebt',
      onClick: () => navigate('/debts/suppliers?tab=old&openModal=true'),
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

      {/* Product Creation Dialog */}
      <ProductCreateDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        onSuccess={() => {
          setProductDialogOpen(false)
        }}
      />

      {/* Batch Import Dialog */}
      <BatchImportDialog
        open={batchImportDialogOpen}
        onOpenChange={setBatchImportDialogOpen}
        productId={null}
        onSuccess={() => {
          setBatchImportDialogOpen(false)
        }}
      />

      {/* Client Creation Dialog */}
      <ClientFormDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        client={null}
        onSuccess={() => {
          setClientDialogOpen(false)
        }}
      />

    </Card>
  )
}
