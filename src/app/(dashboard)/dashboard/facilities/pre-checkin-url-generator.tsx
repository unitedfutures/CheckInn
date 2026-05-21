'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle, Link2, ExternalLink } from 'lucide-react'

interface Props {
  qrSlug: string
  appUrl: string
}

export function PreCheckinUrlDisplay({ qrSlug, appUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${appUrl}/register/${qrSlug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Link2 size={13} className="text-indigo-500" />
        <p className="text-xs font-semibold text-indigo-700">事前登録URL（ゲストに共有）</p>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        このURLをAirbnbやOTAの自動メッセージに貼り付けてください。<br />
        ゲストが日程・宿泊者情報・パスキーを自己登録します。
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 truncate text-gray-600 font-mono">
          {url}
        </code>
        <Button
          size="sm"
          variant={copied ? 'primary' : 'outline'}
          onClick={handleCopy}
          className="shrink-0 gap-1.5"
        >
          {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
          {copied ? 'コピー済み' : 'コピー'}
        </Button>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline"
      >
        <ExternalLink size={11} />
        フォームを確認する
      </a>
    </div>
  )
}
