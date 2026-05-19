'use client'

import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { CheckCircle, AlertCircle, ChevronRight, ShieldCheck, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Facility {
  id: string
  name: string
  address: string | null
  checkin_instructions: string | null
  emergency_contact: string | null
}

type Step = 'welcome' | 'passkey' | 'verifying' | 'success' | 'error'

export function CheckinFlow({ facility }: { facility: Facility }) {
  const [step, setStep] = useState<Step>('welcome')
  const [pinCode, setPinCode] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handlePasskeyAuth = async () => {
    setStep('verifying')
    try {
      // 認証オプション取得
      const optRes = await fetch('/api/passkey/auth-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: facility.id }),
      })
      if (!optRes.ok) {
        const data = await optRes.json()
        setErrorMsg(data.error || '認証の準備に失敗しました')
        setStep('error')
        return
      }
      const options = await optRes.json()

      // ブラウザでパスキー認証
      const credential = await startAuthentication({ optionsJSON: options })

      // 検証
      const verifyRes = await fetch('/api/passkey/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, facility_id: facility.id }),
      })

      const data = await verifyRes.json()
      if (!verifyRes.ok) {
        setErrorMsg(data.error || '照合に失敗しました')
        setStep('error')
        return
      }

      setPinCode(data.pin_code)
      setStep('success')
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setErrorMsg('認証がキャンセルされました。もう一度お試しください。')
      } else {
        setErrorMsg('パスキーの認証に失敗しました。')
      }
      setStep('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ヘッダー */}
        <div className="text-center mb-6">
          <p className="text-gold-400 font-bold text-lg tracking-widest">CheckInn</p>
          <h1 className="text-white text-xl font-bold mt-1">{facility.name}</h1>
          {facility.address && <p className="text-gray-400 text-xs mt-1">{facility.address}</p>}
        </div>

        {/* STEP: 受付開始 */}
        {step === 'welcome' && (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-navy-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h2 className="text-white text-lg font-bold mb-2">チェックイン手続き</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              事前登録時に設定したFace IDまたは指紋でチェックインします。アプリは不要です。
            </p>
            {facility.checkin_instructions && (
              <div className="bg-gray-700 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs text-gray-300 leading-relaxed">{facility.checkin_instructions}</p>
              </div>
            )}
            <Button className="w-full" size="lg" onClick={() => setStep('passkey')}>
              チェックインを開始 <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: パスキー認証 */}
        {step === 'passkey' && (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-navy-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Fingerprint size={32} className="text-white" />
            </div>
            <h2 className="text-white font-bold text-lg mb-2">本人確認</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              事前登録時に設定したパスキーで<br />本人確認を行います。
            </p>
            <Button className="w-full" size="lg" onClick={handlePasskeyAuth}>
              Face ID / 指紋で認証する
            </Button>
          </div>
        )}

        {/* STEP: 照合中 */}
        {step === 'verifying' && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">本人確認中...</p>
            <p className="text-gray-400 text-sm mt-1">しばらくお待ちください</p>
          </div>
        )}

        {/* STEP: 成功 */}
        {step === 'success' && (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <CheckCircle size={52} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-1">チェックイン完了</h2>
            <p className="text-gray-400 text-sm mb-6">ご宿泊ありがとうございます。</p>

            <div className="bg-navy-700/50 border border-gold-400 rounded-2xl p-6 mb-4">
              <p className="text-gold-300 text-sm mb-2">玄関の暗証番号</p>
              <p className="text-white text-5xl font-black tracking-[0.3em] font-mono">{pinCode}</p>
              <p className="text-navy-300 text-xs mt-3">※ この番号はご滞在期間中のみ有効です</p>
            </div>

            {facility.emergency_contact && (
              <div className="bg-gray-700 rounded-xl px-4 py-3 text-sm">
                <p className="text-gray-400 text-xs">緊急連絡先</p>
                <p className="text-white mt-0.5">{facility.emergency_contact}</p>
              </div>
            )}
          </div>
        )}

        {/* STEP: エラー */}
        {step === 'error' && (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <AlertCircle size={52} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-white text-lg font-bold mb-2">照合できませんでした</h2>
            <p className="text-gray-400 text-sm mb-4">{errorMsg}</p>
            {facility.emergency_contact && (
              <div className="bg-gray-700 rounded-xl px-4 py-3 text-sm mb-4">
                <p className="text-gray-400 text-xs">お問い合わせ</p>
                <p className="text-white mt-0.5">{facility.emergency_contact}</p>
              </div>
            )}
            <Button variant="outline" className="w-full text-white border-gray-600" onClick={() => setStep('welcome')}>
              最初からやり直す
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
