'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface Props {
  defaultCompanyName: string
  defaultBeds24ApiKey: string
  defaultAirhostApiKey: string
  email: string
}

export function SettingsForm({ defaultCompanyName, defaultBeds24ApiKey, defaultAirhostApiKey, email }: Props) {
  const [companyName, setCompanyName] = useState(defaultCompanyName)
  const [beds24ApiKey, setBeds24ApiKey] = useState(defaultBeds24ApiKey)
  const [airhostApiKey, setAirhostApiKey] = useState(defaultAirhostApiKey)
  const [showKey, setShowKey] = useState(false)
  const [showAirhostKey, setShowAirhostKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: companyName, beds24_api_key: beds24ApiKey, airhost_api_key: airhostApiKey }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error || '保存に失敗しました')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">アカウント・外部連携</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* メールアドレス（変更不可） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Mail size={13} /> メールアドレス
          </label>
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">{email}</p>
        </div>

        <Input
          id="company_name"
          label="会社名・屋号"
          placeholder="株式会社〇〇"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
        />

        {/* Beds24 APIキー */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beds24 APIキー
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Beds24のAPIキーを入力"
              value={beds24ApiKey}
              onChange={e => setBeds24ApiKey(e.target.value)}
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Beds24管理画面 → Settings → Account → API Key から取得できます
          </p>
        </div>

        {/* Airhost APIキー */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Airhost APIキー
          </label>
          <div className="relative">
            <input
              type={showAirhostKey ? 'text' : 'password'}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="AirhostのAPIキーを入力"
              value={airhostApiKey}
              onChange={e => setAirhostApiKey(e.target.value)}
            />
            <button type="button" onClick={() => setShowAirhostKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showAirhostKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Airhost管理画面 → 設定 → API連携 からAPIキーを取得できます
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <Button onClick={handleSave} loading={loading} className="w-full">
          {saved
            ? <><CheckCircle size={15} className="mr-1.5" /> 保存しました</>
            : '設定を保存'
          }
        </Button>
      </CardContent>
    </Card>
  )
}
