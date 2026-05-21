'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Settings2, Save, CheckCircle, Users } from 'lucide-react'

export type FieldLevel = 'required' | 'optional' | 'off'
export type FormConfig = {
  face_photo: FieldLevel
  address: FieldLevel
  phone: FieldLevel
  num_guests: FieldLevel
}

export const DEFAULT_FORM_CONFIG: FormConfig = {
  face_photo: 'optional',
  address: 'required',
  phone: 'required',
  num_guests: 'required',
}

const FIELDS: {
  key: keyof FormConfig
  label: string
  desc: string
  levels: FieldLevel[]
}[] = [
  {
    key: 'face_photo',
    label: '顔写真',
    desc: '本人確認用の顔写真（防犯カメラとの照合に利用）',
    levels: ['required', 'optional', 'off'],
  },
  {
    key: 'address',
    label: '住所',
    desc: '宿泊者の住所（旅館業法上の記録として推奨）',
    levels: ['required', 'optional'],
  },
  {
    key: 'phone',
    label: '電話番号',
    desc: '緊急時の連絡先',
    levels: ['required', 'optional'],
  },
  {
    key: 'num_guests',
    label: '宿泊人数',
    desc: '同伴者を含む宿泊人数',
    levels: ['required', 'optional', 'off'],
  },
]

const LEVEL_LABEL: Record<FieldLevel, string> = {
  required: '必須',
  optional: '任意',
  off: '非表示',
}
const LEVEL_ACTIVE: Record<FieldLevel, string> = {
  required: 'bg-indigo-100 text-indigo-700 font-semibold',
  optional: 'bg-amber-100 text-amber-700 font-semibold',
  off: 'bg-gray-200 text-gray-500 font-semibold',
}

interface Props {
  facilityId: string
  currentConfig?: Partial<FormConfig>
  currentMaxGuests?: number
}

export function FormConfigEditor({ facilityId, currentConfig, currentMaxGuests = 10 }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<FormConfig>({ ...DEFAULT_FORM_CONFIG, ...currentConfig })
  const [maxGuests, setMaxGuests] = useState(currentMaxGuests)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/facilities', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: facilityId, form_config: config, max_guests: maxGuests }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-600">施設設定</span>
        </div>
        <span className="text-xs text-gray-400">{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-5 bg-white">

          {/* ── 最大宿泊人数 ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={13} className="text-indigo-500" />
              <p className="text-sm font-semibold text-gray-800">最大宿泊人数</p>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              事前登録フォームの人数選択肢の上限になります。
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={30}
                value={maxGuests}
                onChange={e => setMaxGuests(Number(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="w-16 text-center text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">
                {maxGuests}名
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── フォーム項目設定 ── */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">フォーム項目の設定</p>
            <p className="text-xs text-gray-400 mb-3">
              事前登録フォームに表示する項目を設定します。
              <span className="text-gray-500 font-medium">氏名・メールアドレス・規約同意</span>は常に必須です。
            </p>

            <div className="space-y-3">
              {FIELDS.map(({ key, label, desc, levels }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 leading-tight">{desc}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {levels.map(level => (
                      <button
                        key={level}
                        onClick={() => setConfig(c => ({ ...c, [key]: level }))}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                          config[key] === level
                            ? LEVEL_ACTIVE[level]
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {LEVEL_LABEL[level]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <p className="text-xs text-gray-400 mb-3">
              ※ 外国人宿泊者のパスポート情報は、外国人を含む場合に常に表示されます。
            </p>
            <Button size="sm" className="w-full" loading={saving} onClick={handleSave}>
              {saved
                ? <><CheckCircle size={13} className="mr-1.5" />保存しました</>
                : <><Save size={13} className="mr-1.5" />設定を保存する</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
