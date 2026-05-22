'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, CheckCircle, Plus, Trash2, Settings2 } from 'lucide-react'
import type { SurveyConfig, CustomQuestion } from '@/app/survey/[qr_slug]/survey-form'

const STANDARD_ITEMS: { key: keyof SurveyConfig['standard']; label: string }[] = [
  { key: 'overall',     label: '総合満足度（★1〜5）' },
  { key: 'cleanliness', label: '清潔さ（★1〜5）' },
  { key: 'facilities',  label: '設備・アメニティ（★1〜5）' },
  { key: 'location',    label: '立地・アクセス（★1〜5）' },
  { key: 'revisit',     label: 'またご利用いただけますか？（はい/いいえ）' },
  { key: 'comment',     label: 'ご意見・ご感想（自由記述）' },
]

const TYPE_LABEL: Record<CustomQuestion['type'], string> = {
  rating: '★評価（1〜5）',
  yesno:  'はい / いいえ',
  text:   '自由記述',
}

interface Props {
  facilityId:    string
  currentConfig: SurveyConfig
}

export function SurveyConfigEditor({ facilityId, currentConfig }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<SurveyConfig>(currentConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newQ, setNewQ] = useState({ text: '', type: 'rating' as CustomQuestion['type'] })

  const toggleStandard = (key: keyof SurveyConfig['standard']) =>
    setConfig(c => ({ ...c, standard: { ...c.standard, [key]: !c.standard[key] } }))

  const addCustom = () => {
    if (!newQ.text.trim()) return
    const q: CustomQuestion = { id: `q_${Date.now()}`, text: newQ.text.trim(), type: newQ.type }
    setConfig(c => ({ ...c, custom: [...c.custom, q] }))
    setNewQ({ text: '', type: 'rating' })
  }

  const removeCustom = (id: string) =>
    setConfig(c => ({ ...c, custom: c.custom.filter(q => q.id !== id) }))

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/survey-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facility_id: facilityId, survey_config: config }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); router.refresh() }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-600">アンケート設問の設定</span>
        </div>
        <span className="text-xs text-gray-400">{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-5 bg-white">

          {/* 固定設問 ON/OFF */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">固定設問</p>
            <div className="space-y-2">
              {STANDARD_ITEMS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={config.standard[key]}
                    onChange={() => toggleStandard(key)}
                    disabled={key === 'overall'}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 disabled:opacity-40"
                  />
                  <span className={`text-sm ${config.standard[key] ? 'text-gray-800' : 'text-gray-400'}`}>
                    {label}
                    {key === 'overall' && <span className="text-xs text-gray-400 ml-1">（常に表示）</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* カスタム設問 */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">独自設問</p>

            {config.custom.length > 0 && (
              <div className="space-y-2 mb-3">
                {config.custom.map(q => (
                  <div key={q.id} className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 leading-tight">{q.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABEL[q.type]}</p>
                    </div>
                    <button onClick={() => removeCustom(q.id)} className="text-gray-300 hover:text-red-400 shrink-0 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 新規追加 */}
            <div className="space-y-2 p-3 border border-dashed border-gray-300 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">設問を追加</p>
              <Input
                id="new_q_text"
                placeholder="例：駐車場は利用しやすかったですか？"
                value={newQ.text}
                onChange={e => setNewQ(n => ({ ...n, text: e.target.value }))}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newQ.type}
                  onChange={e => setNewQ(n => ({ ...n, type: e.target.value as CustomQuestion['type'] }))}
                >
                  {(Object.entries(TYPE_LABEL) as [CustomQuestion['type'], string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={addCustom} disabled={!newQ.text.trim()}>
                  <Plus size={14} className="mr-1" /> 追加
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <Button size="sm" className="w-full" loading={saving} onClick={handleSave}>
              {saved
                ? <><CheckCircle size={13} className="mr-1.5" />保存しました</>
                : <><Save size={13} className="mr-1.5" />設問を保存する</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
