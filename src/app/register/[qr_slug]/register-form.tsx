'use client'

import { useState, useRef } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, ChevronRight, ChevronLeft, Upload, X, Fingerprint, Camera, CalendarDays } from 'lucide-react'

interface Props {
  qrSlug: string
  facilityName: string
  formConfig: Record<string, string>
  maxGuests?: number
}

type Step = 'booking' | 'basic' | 'passport' | 'terms' | 'passkey' | 'done'
type Level = 'required' | 'optional' | 'off'

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

export function RegisterForm({ qrSlug, facilityName, formConfig, maxGuests = 10 }: Props) {
  const cfg = (key: string): Level => (formConfig[key] as Level) ?? 'required'
  const show = (key: string) => cfg(key) !== 'off'
  const isRequired = (key: string) => cfg(key) === 'required'

  const [step, setStep] = useState<Step>('booking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestRecordId, setGuestRecordId] = useState('')

  // Step 1: 宿泊日程
  const today = new Date().toISOString().split('T')[0]
  const [bookingInfo, setBookingInfo] = useState({
    checkin_date:      '',
    checkout_date:     '',
    num_guests:        1,
    checkin_time:      '',
    checkout_time:     '',
    previous_location: '',
    next_destination:  '',
  })

  // Step 2: 基本情報
  const [basic, setBasic] = useState({
    full_name:   '',
    email:       '',
    phone:       '',
    address:     '',
    age:         '',
    nationality: '',
    is_foreign:  false,
  })

  // 顔写真
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState('')
  const faceInputRef = useRef<HTMLInputElement>(null)

  // Step 3: パスポート
  const [passport, setPassport] = useState({ nationality: '', passport_number: '' })
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPreview, setPassportPreview] = useState('')
  const passportInputRef = useRef<HTMLInputElement>(null)

  // Step 4: 規約
  const [agreed, setAgreed] = useState(false)

  const setB = (k: string, v: string | number | boolean) => setBasic(b => ({ ...b, [k]: v }))
  const setBK = (k: string, v: string | number) => setBookingInfo(b => ({ ...b, [k]: v }))

  const handleFileSelect = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    setFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const bookingValid = () =>
    !!bookingInfo.checkin_date &&
    !!bookingInfo.checkout_date &&
    bookingInfo.checkout_date > bookingInfo.checkin_date

  const basicValid = () => {
    if (!basic.full_name || !basic.email) return false
    if (show('phone')       && isRequired('phone')       && !basic.phone)       return false
    if (show('address')     && isRequired('address')     && !basic.address)     return false
    if (show('age')         && isRequired('age')         && !basic.age)         return false
    if (show('nationality') && isRequired('nationality') && !basic.nationality) return false
    if (show('face_photo')  && isRequired('face_photo')  && !faceFile)          return false
    return true
  }

  const bookingInfoValid = () => {
    if (!bookingValid()) return false
    if (show('checkin_time')      && isRequired('checkin_time')      && !bookingInfo.checkin_time)      return false
    if (show('checkout_time')     && isRequired('checkout_time')     && !bookingInfo.checkout_time)     return false
    if (show('previous_location') && isRequired('previous_location') && !bookingInfo.previous_location) return false
    if (show('next_destination')  && isRequired('next_destination')  && !bookingInfo.next_destination)  return false
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('qr_slug', qrSlug)
    formData.append('booking', JSON.stringify(bookingInfo))
    formData.append('basic', JSON.stringify({
      ...basic,
      age: basic.age ? parseInt(basic.age) : null,
    }))
    formData.append('passport', JSON.stringify(passport))
    if (passportFile) formData.append('passport_image', passportFile)
    if (faceFile) formData.append('face_photo', faceFile)

    const res = await fetch('/api/register', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'エラーが発生しました')
      return
    }

    setGuestRecordId(data.guest_record_id)
    setStep('passkey')
  }

  const handlePasskeyRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const optRes = await fetch('/api/passkey/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_record_id: guestRecordId }),
      })
      const options = await optRes.json()
      const credential = await startRegistration({ optionsJSON: options })
      const verifyRes = await fetch('/api/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_record_id: guestRecordId, credential }),
      })
      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        setError(data.error || 'パスキーの登録に失敗しました')
        return
      }
      setStep('done')
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError('認証がキャンセルされました。もう一度お試しください。')
      } else {
        setError('パスキーの登録に失敗しました。WebAuthn対応デバイスか確認してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 'booking') setStep('basic')
    else if (step === 'basic') setStep(basic.is_foreign ? 'passport' : 'terms')
    else if (step === 'passport') setStep('terms')
  }
  const prevStep = () => {
    if (step === 'basic') setStep('booking')
    else if (step === 'terms') setStep(basic.is_foreign ? 'passport' : 'basic')
    else if (step === 'passport') setStep('basic')
  }

  // ─── 完了画面 ─────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 text-center">
        <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">事前登録が完了しました</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          チェックイン用リンクをメールでお送りしました。<br />
          当日は施設玄関のQRコードをスキャンし、<br />
          Face ID または指紋認証でチェックインしてください。
        </p>
      </div>
    )
  }

  // ─── パスキー登録画面 ──────────────────────────────────────────────
  if (step === 'passkey') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 text-center space-y-5">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
            <Fingerprint size={32} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">チェックイン用パスキーの設定</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              施設到着時のチェックインに使用します。<br />
              Face ID または指紋認証でパスキーを登録してください。
            </p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Button className="w-full" size="lg" loading={loading} onClick={handlePasskeyRegister}>
            Face ID / 指紋でパスキーを登録
          </Button>
        </div>
      </div>
    )
  }

  // ─── ステップインジケーター ───────────────────────────────────────
  const stepLabels = basic.is_foreign
    ? ['宿泊日程', '基本情報', 'パスポート', '規約同意']
    : ['宿泊日程', '基本情報', '規約同意']
  const stepKeys: Step[] = basic.is_foreign
    ? ['booking', 'basic', 'passport', 'terms']
    : ['booking', 'basic', 'terms']
  const currentIdx = stepKeys.indexOf(step)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ステップインジケーター */}
      <div className="flex border-b border-gray-100">
        {stepLabels.map((label, i) => (
          <div key={label} className={`flex-1 py-3 text-center text-xs font-medium transition-colors
            ${i === currentIdx ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1
              ${i === currentIdx ? 'bg-indigo-600 text-white' : i < currentIdx ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < currentIdx ? '✓' : i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      <div className="p-6">

        {/* ===== Step 1: 宿泊日程 ===== */}
        {step === 'booking' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={18} className="text-indigo-500" />
              <h3 className="font-semibold text-gray-900">宿泊日程の入力</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="checkin" type="date" label="チェックイン日 *"
                min={today}
                value={bookingInfo.checkin_date}
                onChange={e => setBK('checkin_date', e.target.value)}
                required
              />
              <Input
                id="checkout" type="date" label="チェックアウト日 *"
                min={bookingInfo.checkin_date || today}
                value={bookingInfo.checkout_date}
                onChange={e => setBK('checkout_date', e.target.value)}
                required
              />
            </div>
            {bookingInfo.checkin_date && bookingInfo.checkout_date && bookingInfo.checkout_date <= bookingInfo.checkin_date && (
              <p className="text-xs text-red-500">チェックアウト日はチェックイン日より後の日付を選択してください</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宿泊人数 *</label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bookingInfo.num_guests}
                onChange={e => setBK('num_guests', parseInt(e.target.value))}
              >
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}名</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">最大 {maxGuests}名まで</p>
            </div>

            {/* 追加フィールド：チェックイン・アウト時間 */}
            {(show('checkin_time') || show('checkout_time')) && (
              <div className="grid grid-cols-2 gap-3">
                {show('checkin_time') && (
                  <Input
                    id="checkin_time" type="time"
                    label={`チェックイン時間${isRequired('checkin_time') ? ' *' : '（任意）'}`}
                    value={bookingInfo.checkin_time}
                    onChange={e => setBK('checkin_time', e.target.value)}
                    required={isRequired('checkin_time')}
                  />
                )}
                {show('checkout_time') && (
                  <Input
                    id="checkout_time" type="time"
                    label={`チェックアウト時間${isRequired('checkout_time') ? ' *' : '（任意）'}`}
                    value={bookingInfo.checkout_time}
                    onChange={e => setBK('checkout_time', e.target.value)}
                    required={isRequired('checkout_time')}
                  />
                )}
              </div>
            )}

            {show('previous_location') && (
              <Input
                id="previous_location"
                label={`前出発地${isRequired('previous_location') ? ' *' : '（任意）'}`}
                placeholder="例：東京"
                value={bookingInfo.previous_location}
                onChange={e => setBK('previous_location', e.target.value)}
                required={isRequired('previous_location')}
              />
            )}

            {show('next_destination') && (
              <Input
                id="next_destination"
                label={`行き先地${isRequired('next_destination') ? ' *' : '（任意）'}`}
                placeholder="例：大阪"
                value={bookingInfo.next_destination}
                onChange={e => setBK('next_destination', e.target.value)}
                required={isRequired('next_destination')}
              />
            )}

            <Button className="w-full" size="lg" disabled={!bookingInfoValid()} onClick={nextStep}>
              次へ <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {/* ===== Step 2: 基本情報 ===== */}
        {step === 'basic' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">基本情報の入力</h3>

            <Input id="full_name" label="お名前（代表者） *" placeholder="山田 太郎"
              value={basic.full_name} onChange={e => setB('full_name', e.target.value)} required />
            <Input id="email" type="email" label="メールアドレス *" placeholder="example@email.com"
              value={basic.email} onChange={e => setB('email', e.target.value)} required />

            {show('phone') && (
              <Input id="phone" type="tel"
                label={`電話番号${isRequired('phone') ? ' *' : '（任意）'}`}
                placeholder="090-0000-0000"
                value={basic.phone} onChange={e => setB('phone', e.target.value)}
                required={isRequired('phone')} />
            )}

            {show('age') && (
              <Input id="age" type="number"
                label={`年齢${isRequired('age') ? ' *' : '（任意）'}`}
                placeholder="例：35"
                value={basic.age} onChange={e => setB('age', e.target.value)}
                required={isRequired('age')} />
            )}

            {show('nationality') && (
              <Input id="nationality"
                label={`国籍${isRequired('nationality') ? ' *' : '（任意）'}`}
                placeholder="例：日本"
                value={basic.nationality} onChange={e => setB('nationality', e.target.value)}
                required={isRequired('nationality')} />
            )}

            {show('address') && (
              <Input id="address"
                label={`住所${isRequired('address') ? ' *' : '（任意）'}`}
                placeholder="東京都〇〇区〇〇1-2-3"
                value={basic.address} onChange={e => setB('address', e.target.value)}
                required={isRequired('address')} />
            )}

            {/* 顔写真 */}
            {show('face_photo') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Camera size={14} className="text-gray-500" />
                    顔写真{isRequired('face_photo') ? ' *' : '（任意）'}
                  </span>
                </label>
                <p className="text-xs text-gray-400 mb-2">本人確認のため、正面からの顔写真をアップロードしてください</p>
                {facePreview ? (
                  <div className="relative inline-block">
                    <img src={facePreview} alt="face" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => { setFaceFile(null); setFacePreview('') }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200">
                      <X size={12} className="text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => faceInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                    <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">タップして写真を選択</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG / PNG</p>
                  </button>
                )}
                <input ref={faceInputRef} type="file" accept="image/*" capture="user" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, setFaceFile, setFacePreview) }} />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600"
                checked={basic.is_foreign} onChange={e => setB('is_foreign', e.target.checked)} />
              <span className="text-sm text-gray-700">外国人宿泊者を含む（パスポート情報が必要です）</span>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ChevronLeft size={16} className="mr-1" /> 戻る
              </Button>
              <Button className="flex-1" size="lg" disabled={!basicValid()} onClick={nextStep}>
                次へ <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ===== Step 3: パスポート ===== */}
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
                <button onClick={() => passportInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">タップして画像を選択</p>
                  <p className="text-xs text-gray-400 mt-1">JPG / PNG</p>
                </button>
              )}
              <input ref={passportInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, setPassportFile, setPassportPreview) }} />
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

        {/* ===== Step 4: 規約同意 ===== */}
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
                次へ（パスキー設定）
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
