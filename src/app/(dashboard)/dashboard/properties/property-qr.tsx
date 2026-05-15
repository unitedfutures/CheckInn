'use client'

import { useState } from 'react'
import { QrCode, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QRCode from 'qrcode'

interface Property {
  id: string
  name: string
  qr_slug: string
}

export function PropertyQR({ property }: { property: Property }) {
  const [open, setOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const checkinUrl = `${appUrl}/checkin/${property.qr_slug}`

  const handleOpen = async () => {
    const url = await QRCode.toDataURL(checkinUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
    setQrUrl(url)
    setOpen(true)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `yokoso-qr-${property.qr_slug}.png`
    a.click()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} className="w-full">
        <QrCode size={14} className="mr-1.5" />
        QRコードを表示
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">このQRコードを玄関前に貼ってください</p>

            {qrUrl && (
              <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl border border-gray-100 shadow-sm" />
            )}

            <p className="text-xs text-gray-400 mt-3 break-all font-mono">{checkinUrl}</p>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                閉じる
              </Button>
              <Button className="flex-1" onClick={handleDownload}>
                <Download size={14} className="mr-1.5" />
                ダウンロード
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
