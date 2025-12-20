import { useRef } from "react"
import { Printer } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChequePreview } from "./cheque-preview"
import { toast } from "sonner"
import type { SaleDetail } from "@/types/sales"

interface ChequePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleData?: SaleDetail | null
}

export function ChequePreviewModal({
  open,
  onOpenChange,
  saleData,
}: ChequePreviewModalProps) {
  const chequeRef = useRef<HTMLDivElement>(null)

  const handlePrint = async () => {
    console.log('Print button clicked')
    
    if (!chequeRef.current) {
      console.error('Cheque ref is null')
      return
    }

    try {
      // Extract plain text from the cheque preview
      const chequeText = chequeRef.current.innerText
      
      console.log('Sending to Tauri print command...')
      
      // Call Tauri Rust function to print
      const result = await invoke<string>('print_receipt', { content: chequeText })
      
      console.log('Print result:', result)
      toast.success('Print Sent', {
        description: result
      })
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Print Failed', {
        description: String(error)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cheque Preview</DialogTitle>
        </DialogHeader>

        <div className="my-4 overflow-x-auto">
          <ChequePreview ref={chequeRef} saleData={saleData} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Cheque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
