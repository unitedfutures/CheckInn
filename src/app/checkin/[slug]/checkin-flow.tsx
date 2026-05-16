'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, QrCode, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Facility {
  id: string
  name: string
  address: string | null
  checkin_instructions: string | null
  emergency_contact: string | null
}

type Step = 'welcome' | 'face' | 'qr_input' | 'verifying' | 'success' | 'error'

export function CheckinFlow({ facility }: { facility: Facility }) {
  const [step, setStep] = useState<Step>('welcome')
  const [facePhotoDataUrl, setFacePhotoDataUrl] = useState<string>('')
  const [guestQrToken, setGuestQrToken] = useState<string>('')
  const [pinCode, setPinCode] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // カメラ起動
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      setErrorMsg('カメラへのアクセスが許可されていません。設定を確認してください。')
      setStep('error')
    }
  }, [])

  // カメラ停止
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  // 顔写真撮影
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setFacePhotoDataUrl(dataUrl)
    stopCamera()
    setStep('qr_input')
  }, [stopCamera])

  // チェックイン照合
  const handleVerify = async () => {
    if (!guestQrToken.trim()) return
    setStep('verifying')

    // URLからトークンを抽出（QRにURLが含まれる場合）
    let token = guestQrToken.trim()
    try {
      const url = new URL(token)
      const parts = url.pathname.split('/')
      token = parts[parts.length - 1]
    } catch { /* URL形式でなければそのまま使用 */ }

    const res = await fetch('/api/checkin-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facility_id: facility.id,
        guest_qr_token: token,
        face_photo: facePhotoDataUrl,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error || '照合に失敗しました')
      setStep('error')
      return
    }

    setPinCode(data.pin_code)
    setStep('success')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ヘッダー */}
        <div className="text-center mb-6">
          <p className="text-indigo-400 font-bold text-lg tracking-widest">CheckInn</p>
          <h1 className="text-white text-xl font-bold mt-1">{facility.name}</h1>
          {facility.address && <p className="text-gray-400 text-xs mt-1">{facility.address}</p>}
        </div>

        {/* STEP: 受付開始 */}
        {step === 'welcome' && (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-white" />
            </div>
            <h2 className="text-white text-lg font-bold mb-2">チェックイン手続き</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              事前登録がお済みの方は、チェックイン手続きを開始してください。<br />
              顔写真の撮影と、メールのQRコードが必要です。
            </p>
            {facility.checkin_instructions && (
              <div className="bg-gray-700 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs text-gray-300 leading-relaxed">{facility.checkin_instructions}</p>
              </div>
            )}
            <Button className="w-full" size="lg" onClick={() => { setStep('face'); startCamera() }}>
              チェックインを開始 <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: 顔写真撮影 */}
        {step === 'face' && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Camera size={18} className="text-indigo-400" />
              <h2 className="text-white font-bold">顔写真の撮影</h2>
            </div>
            <p className="text-gray-400 text-xs mb-4">正面を向いて、顔全体が映るように撮影してください（法令要件）</p>

            <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] mb-4">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">カメラを起動中...</p>
                </div>
              )}
              {/* 顔ガイド枠 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-52 border-2 border-dashed border-white/40 rounded-full" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <Button className="w-full" size="lg" onClick={capturePhoto} disabled={!cameraActive}>
              <Camera size={18} className="mr-2" /> 撮影する
            </Button>
          </div>
        )}

        {/* STEP: QRコード入力 */}
        {step === 'qr_input' && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-indigo-400" />
              <h2 className="text-white font-bold">チェックイン用QRコード</h2>
            </div>

            {facePhotoDataUrl && (
              <div className="flex items-center gap-2 bg-green-900/30 border border-green-600 rounded-xl px-3 py-2 mb-4">
                <CheckCircle size={14} className="text-green-400" />
                <p className="text-green-400 text-xs">顔写真の撮影が完了しました</p>
              </div>
            )}

            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
              メールに届いた「チェックイン用リンクを開く」ボタンをタップするか、
              URLをこちらに貼り付けてください。
            </p>

            <textarea
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="https://checkin.example.com/checkin-verify/..."
              value={guestQrToken}
              onChange={e => setGuestQrToken(e.target.value)}
            />

            <p className="text-gray-500 text-xs mt-2 mb-4">※ QRコードリーダーで読み取ったURLをそのまま貼り付けてください</p>

            <Button className="w-full" size="lg" onClick={handleVerify} disabled={!guestQrToken.trim()}>
              照合してチェックイン <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: 照合中 */}
        {step === 'verifying' && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">予約情報を照合中...</p>
            <p className="text-gray-400 text-sm mt-1">しばらくお待ちください</p>
          </div>
        )}

        {/* STEP: 成功 */}
        {step === 'success' && (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <CheckCircle size={52} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-1">チェックイン完了</h2>
            <p className="text-gray-400 text-sm mb-6">ご宿泊ありがとうございます。</p>

            <div className="bg-indigo-900/50 border border-indigo-500 rounded-2xl p-6 mb-4">
              <p className="text-indigo-300 text-sm mb-2">玄関の暗証番号</p>
              <p className="text-white text-5xl font-black tracking-[0.3em] font-mono">{pinCode}</p>
              <p className="text-indigo-400 text-xs mt-3">※ この番号はご滞在期間中のみ有効です</p>
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
