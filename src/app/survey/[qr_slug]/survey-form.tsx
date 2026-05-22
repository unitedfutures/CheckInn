'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Star, ThumbsUp, ThumbsDown } from 'lucide-react'

// ─── 型定義 ───────────────────────────────────────────────────────────────

export type StandardConfig = {
  overall:     boolean
  cleanliness: boolean
  facilities:  boolean
  location:    boolean
  revisit:     boolean
  comment:     boolean
}

export type CustomQuestion = {
  id:   string
  text: string
  type: 'rating' | 'text' | 'yesno'
}

export type SurveyConfig = {
  standard: StandardConfig
  custom:   CustomQuestion[]
}

const STANDARD_LABELS: Record<keyof Omit<StandardConfig, 'comment' | 'revisit'>, string> = {
  overall:     '総合満足度',
  cleanliness: '清潔さ',
  facilities:  '設備・アメニティ',
  location:    '立地・アクセス',
}

// ─── 星評価コンポーネント ──────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={`transition-colors ${
              n <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── はい・いいえコンポーネント ───────────────────────────────────────────

function YesNoToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {(['yes', 'no'] as const).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            value === v
              ? v === 'yes'
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-red-50 text-red-600 border-red-200'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          {v === 'yes' ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
          {v === 'yes' ? 'はい' : 'いいえ'}
        </button>
      ))}
    </div>
  )
}

// ─── メインフォーム ───────────────────────────────────────────────────────

interface Props {
  qrSlug:       string
  facilityName: string
  config:       SurveyConfig
}

export function SurveyForm({ qrSlug, facilityName, config }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 回答の状態
  const [answers, setAnswers] = useState<Record<string, number | string>>({})
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [stayCheckin, setStayCheckin] = useState('')
  const [stayCheckout, setStayCheckout] = useState('')

  const setAnswer = (key: string, val: number | string) =>
    setAnswers(a => ({ ...a, [key]: val }))

  const handleSubmit = async () => {
    // 総合満足度は必須
    if (config.standard.overall && !answers['overall']) {
      setError('総合満足度をご選択ください')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qr_slug:         qrSlug,
        respondent_name:  name || null,
        respondent_email: email || null,
        stay_checkin:     stayCheckin || null,
        stay_checkout:    stayCheckout || null,
        answers:          { ...answers, comment: comment || null },
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'エラーが発生しました'); return }
    setSubmitted(true)
  }

  // ─── 送信完了 ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100 text-center">
        <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">ご回答ありがとうございました</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          大切なご意見をお寄せいただきありがとうございます。<br />
          今後のサービス向上に役立ててまいります。
        </p>
      </div>
    )
  }

  const ratingKeys = (['overall', 'cleanliness', 'facilities', 'location'] as const).filter(
    k => config.standard[k]
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 space-y-7">

        {/* 滞在日程（任意） */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">ご滞在期間（任意）</p>
          <div className="grid grid-cols-2 gap-3">
            <Input id="stay_checkin" type="date" label="チェックイン日"
              value={stayCheckin} onChange={e => setStayCheckin(e.target.value)} />
            <Input id="stay_checkout" type="date" label="チェックアウト日"
              value={stayCheckout} onChange={e => setStayCheckout(e.target.value)} />
          </div>
        </div>

        {/* 星評価 */}
        {ratingKeys.length > 0 && (
          <div className="space-y-5">
            {ratingKeys.map(key => (
              <div key={key}>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {STANDARD_LABELS[key]}
                  {key === 'overall' && <span className="text-red-400 ml-1 text-xs">*</span>}
                </p>
                <StarRating
                  value={(answers[key] as number) || 0}
                  onChange={v => setAnswer(key, v)}
                />
              </div>
            ))}
          </div>
        )}

        {/* またご利用いただけますか */}
        {config.standard.revisit && (
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">またご利用いただけますか？</p>
            <YesNoToggle
              value={(answers['revisit'] as string) || ''}
              onChange={v => setAnswer('revisit', v)}
            />
          </div>
        )}

        {/* カスタム質問 */}
        {config.custom.map(q => (
          <div key={q.id}>
            <p className="text-sm font-semibold text-gray-800 mb-2">{q.text}</p>
            {q.type === 'rating' && (
              <StarRating
                value={(answers[q.id] as number) || 0}
                onChange={v => setAnswer(q.id, v)}
              />
            )}
            {q.type === 'yesno' && (
              <YesNoToggle
                value={(answers[q.id] as string) || ''}
                onChange={v => setAnswer(q.id, v)}
              />
            )}
            {q.type === 'text' && (
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                placeholder="ご自由にお書きください"
                value={(answers[q.id] as string) || ''}
                onChange={e => setAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        {/* 自由コメント */}
        {config.standard.comment && (
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">ご意見・ご感想（任意）</p>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="ご滞在のご感想、改善点など、なんでもお聞かせください"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        )}

        {/* お名前・メール（任意） */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <p className="text-xs text-gray-400">お名前・メールアドレスの入力は任意です</p>
          <div className="grid grid-cols-2 gap-3">
            <Input id="name" label="お名前（任意）" placeholder="山田 太郎"
              value={name} onChange={e => setName(e.target.value)} />
            <Input id="email" type="email" label="メールアドレス（任意）" placeholder="example@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Button className="w-full" size="lg" loading={loading} onClick={handleSubmit}>
          アンケートを送信する
        </Button>
      </div>
    </div>
  )
}
