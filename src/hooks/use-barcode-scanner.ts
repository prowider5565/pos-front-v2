import { useEffect, useEffectEvent } from 'react'
import { listen } from '@tauri-apps/api/event'

interface BarcodeScannedPayload {
  barcode?: string
}

interface UseBarcodeScannerOptions {
  enabled?: boolean
  onBarcode: (barcode: string) => Promise<void> | void
}

export function useBarcodeScanner({
  enabled = true,
  onBarcode,
}: UseBarcodeScannerOptions) {
  const handleBarcode = useEffectEvent(async (barcode: string) => {
    await onBarcode(barcode)
  })

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isDisposed = false
    let queue = Promise.resolve()
    let detach: (() => void) | undefined

    void listen<BarcodeScannedPayload>('barcode_scanned', (event) => {
      const barcode = event.payload?.barcode?.trim()
      if (!barcode || isDisposed) {
        return
      }

      queue = queue
        .then(async () => {
          if (isDisposed) {
            return
          }
          await handleBarcode(barcode)
        })
        .catch((error) => {
          console.error('Failed to process barcode scan event:', error)
        })
    })
      .then((unlisten) => {
        if (isDisposed) {
          unlisten()
          return
        }
        detach = unlisten
      })
      .catch((error) => {
        console.error('Failed to subscribe to barcode scanner events:', error)
      })

    return () => {
      isDisposed = true
      detach?.()
    }
  }, [enabled, handleBarcode])
}
