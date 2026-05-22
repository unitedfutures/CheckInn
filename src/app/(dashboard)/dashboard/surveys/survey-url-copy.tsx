'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle, ExternalLink } from 'lucide-react'

export function SurveyUrlCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 truncate text-gray-600 font-mono">
          {url}
        </code>
        <Button size="sm" variant={copied ? 'primary' : 'outline'} onClick={handleCopy} className="shrink-0 gap-1.5">
          {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
          {copied ? 'コピー済み' : 'コピー'}
        </Button>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline">
        <ExternalLink size={11} /> フォームを確認する
      </a>
    </div>
  )
}
