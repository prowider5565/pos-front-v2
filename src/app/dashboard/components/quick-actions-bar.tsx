import { Card, CardContent } from '@/components/ui/card'
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

const quickActions = [
  {
    icon: Package,
    label: 'Add New Product',
    onClick: () => console.log('Add new product'),
  },
  {
    icon: PackageOpen,
    label: 'Import New Batch',
    onClick: () => console.log('Import new batch'),
  },
  {
    icon: Store,
    label: 'Add New Supplier',
    onClick: () => console.log('Add new supplier'),
  },
  {
    icon: Users,
    label: 'Add New Client',
    onClick: () => console.log('Add new client'),
  },
  {
    icon: UserPlus,
    label: 'Add New Staff',
    onClick: () => console.log('Add new staff'),
  },
  {
    icon: Wallet,
    label: 'Pay Client Debt',
    onClick: () => console.log('Pay client debt'),
  },
  {
    icon: CreditCard,
    label: 'Pay Supplier Debt',
    onClick: () => console.log('Pay supplier debt'),
  },
  {
    icon: FileText,
    label: 'Add Old Client Debt',
    onClick: () => console.log('Add old client debt'),
  },
  {
    icon: ClipboardList,
    label: 'Add Old Seller Debt',
    onClick: () => console.log('Add old seller debt'),
  },
]

export function QuickActionsBar() {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
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
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
