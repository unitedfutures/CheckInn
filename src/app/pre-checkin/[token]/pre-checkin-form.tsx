'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, ChevronRight, ChevronLeft, Upload, X } from 'lucide-react'

interface Props {
  token: string
  bookingId: string
  defaultEmail: string
  defaultName: string
  numGuests: number
}

type Step = 'basic' | 'passport' | 'terms' | 'done'

const TERMS_TEXT = `宿泊約款・ハウスルール

【宿泊約款】
1. チェックイン時間は15:00〜22:00、チェックアウトは10:00です。
2. 施設内での喫煙は禁止です（屋外指定場所のみ可）。
3. ペットの同伴はご遠慮ください。
4. 深夜22:00以降の騒音はご遠慮ください。
5. ゴミは所定の場所に分別して捨ててください。

【旅館業法に基づく宿泊者名簿について】
旅館業法第6条に基づき、宿泊者の氏名・住所・連絡先を名簿に記載させていただきます。
取得した個人情報は宿泊者名簿の作成および法令上の義務を果たす目的のみに使用し、
法定保存期間（3年間）経過後に適切に削除します。

【免責事項】
施設内での事故・盗難については施設は責任を負いかねます。
貴重品の管理はお客様ご自身でお願いします。`

export function PreCheckinForm({ token, defaultEmail, defaultName, numGuests }: Props) {
  const [step, setStep] = useState<Step>('basic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: 基本情報
  const [basic, setBasic] = useState({
    full_name: defaultName,
    email: defaultEmail,
    phone: '',
    address: '',
    num_guests: numGuests,
    is_foreign: false,
  })

  // Step 2: パスポート（外国人のみ）
  const [passport, setPassport] = useState({
    nationality: '',
    passport_number: '',
  })
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPreview, setPassportPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3: 規約同意
  const [agreed, setAgreed] = useState(false)

  const setB = (k: string, v: string | number | boolean) => setBasic(b => ({ ...b, [k]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPassportFile(file)
    const reader = new FileReader()
    reader.onload = () => setPassportPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('token', token)
    formData.append('basic', JSON.stringify(basic))
    formData.append('passport', JSON.stringify(passport))
    if (passportFile) formData.append('passport_image', passportFile)

    const res = await fetch(`/api/pre-checkin/${token}`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'エラーが発生しました')
      setLoading(false)
      return
    }

    setStep('done')
    setLoading(false)
  }

  const nextStep = () => {
    if (step === 'basic') setStep(basic.is_foreign ? 'passport' : 'terms')
    else if (step === 'passport') setStep('terms')
  }

  const prevStep = () => {
    if (step === 'terms') setStep(basic.is_foreign ? 'passport' : 'basic')
    else if (step === 'passport') setStep('basic')
  }

  // --- 完了画面 ---
  if (step === 'done') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 text-center">
        <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">事前登録が完了しました</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          チェックイン用QRコードをメールでお送りしました。<br />
          当日は施設玄関のQRコードをスキャンし、<br />
          メールのQRコードを画面に表示してください。
        </p>
      </div>
    )
  }

  // --- ステップインジケーター ---
  const steps = basic.is_foreign
    ? ['基本情報', 'パスポート', '規約同意']
    : ['基本情報', '規約同意']
  const currentIdx = step === 'basic' ? 0 : step === 'passport' ? 1 : basic.is_foreign ? 2 : 1

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ステップインジケーター */}
      <div className="flex border-b border-gray-100">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 py-3 text-center text-xs font-medium transition-colors
            ${i === currentIdx ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1
              ${i === currentIdx ? 'bg-indigo-600 text-white' : i < currentIdx ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < currentIdx ? '✓' : i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>

      <div className="p-6">
        {/* Step 1: 基本情報 */}
        {step === 'basic' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">基本情報の入力</h3>
            <Input id="full_name" label="お名前（代表者） *" placeholder="山田 太郎"
              value={basic.full_name} onChange={e => setB('full_name', e.target.value)} required />
            <Input id="email" type="email" label="メールアドレス *" placeholder="example@email.com"
              value={basic.email} onChange={e => setB('email', e.target.value)} required />
            <Input id="phone" type="tel" label="電話番号 *" placeholder="090-0000-0000"
              value={basic.phone} onChange={e => setB('phone', e.target.value)} required />
            <Input id="address" label="住所 *" placeholder="東京都〇〇区〇〇1-2-3"
              value={basic.address} onChange={e => setB('address', e.target.value)} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宿泊人数 *</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={basic.num_guests} onChange={e => setB('num_guests', parseInt(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}名</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600"
                checked={basic.is_foreign} onChange={e => setB('is_foreign', e.target.checked)} />
              <span className="text-sm text-gray-700">外国人宿泊者を含む（パスポート情報が必要です）</span>
            </label>
            <Button className="w-full" size="lg"
              disabled={!basic.full_name || !basic.email || !basic.phone || !basic.address}
              onClick={nextStep}>
              次へ <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: パスポート */}
        {step === 'passport' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">パスポート情報</h3>
            <Input id="nationality" label="国籍 *" placeholder="例：American / 中国"
              value={passport.nationality} onChange={e => setPassport(p => ({ ...p, nationality: e.target.value }))} required />
            <Input id="passport_number" label="旅券番号 *" placeholder="例：TK1234567"
              value={passport.passport_number} onChange={e => setPassport(p => ({ ...p, passport_number: e.target.value }))} required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">旅券画像アップロード *</label>
              {passportPreview ? (
                <div className="relative">
                  <img src={passportPreview} alt="passport" className="w-full rounded-xl border border-gray-200 object-cover max-h-48" />
                  <button onClick={() => { setPassportFile(null); setPassportPreview('') }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm border border-gray-200">
                    <X size={14} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">タップして画像を選択</p>
                  <p className="text-xs text-gray-400 mt-1">JPG / PNG</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ChevronLeft size={16} className="mr-1" /> 戻る
              </Button>
              <Button className="flex-1"
                disabled={!passport.nationality || !passport.passport_number || !passportFile}
                onClick={nextStep}>
                次へ <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 規約同意 */}
        {step === 'terms' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">宿泊約款・ハウスルールへの同意</h3>
            <div className="bg-gray-50 rounded-xl p-4 h-56 overflow-y-auto text-xs text-gray-600 leading-relaxed whitespace-pre-wrap border border-gray-200">
              {TERMS_TEXT}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-indigo-600"
                checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span className="text-sm text-gray-700">
                上記の宿泊約款およびハウスルールを読み、内容に同意します。<br />
                <span className="text-xs text-gray-400">（同意日時・IPアドレスを記録します）</span>
              </span>
            </label>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ChevronLeft size={16} className="mr-1" /> 戻る
              </Button>
              <Button className="flex-1" disabled={!agreed} loading={loading} onClick={handleSubmit}>
                登録を完了する
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
