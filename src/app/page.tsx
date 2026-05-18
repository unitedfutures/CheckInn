import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  QrCode, ShieldCheck, FileText, Smartphone, ArrowRight,
  CheckCircle, AlertTriangle, Building2, Clock, Lock,
  ChevronRight, Star, Users, Globe
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ============ NAV ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-indigo-600 tracking-widest">CheckInn</span>
          <div className="flex items-center gap-4">
            <Link href="#features" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">機能</Link>
            <Link href="#flow" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">使い方</Link>
            <Link href="#compliance" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">法令対応</Link>
            {user ? (
              <Link href="/dashboard"
                className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                ダッシュボード
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">ログイン</Link>
                <Link href="/signup"
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  無料で始める
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <AlertTriangle size={13} />
            旅館業法 令和7年4月改正施行 — 無人施設に新たな本人確認義務
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
            無人宿泊施設の<br />
            <span className="text-indigo-600">チェックイン</span>を、<br />
            法令対応で完全自動化。
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
            QRコードひとつで本人確認・宿泊者名簿への自動記録まで。
            スタッフ不在でも、旅館業法の要件を満たすチェックインを実現します。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              無料で始める
              <ArrowRight size={18} />
            </Link>
            <Link href="#flow"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-600 font-medium text-base px-8 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              使い方を見る
              <ChevronRight size={18} />
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-6">クレジットカード不要・初期費用0円</p>
        </div>

        {/* ダッシュボードイメージ */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-500 text-xs ml-2">CheckInn — 管理ダッシュボード</span>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6">
              {[
                { label: '施設数', value: '4', color: 'text-indigo-400' },
                { label: '今月の予約', value: '28', color: 'text-blue-400' },
                { label: 'チェックイン済み', value: '12', color: 'text-green-400' },
                { label: '宿泊者名簿', value: '84', color: 'text-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                  <p className="text-gray-400 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-2">
              {['八ヶ岳コテージ', '姫木平ヴィラ', '蓼科ロッジ'].map((name, i) => (
                <div key={name} className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-gray-500" />
                    <span className="text-gray-300 text-sm">{name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-green-900 text-green-300' : i === 1 ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-400'}`}>
                    {i === 0 ? 'チェックイン済み' : i === 1 ? '事前登録待ち' : '未送信'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm tracking-widest mb-3">PROBLEM</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              無人運営が、<span className="text-red-600">法律の壁</span>に直面しています。
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              令和7年4月の旅館業法改正により、無人施設には新たな本人確認・記録義務が課されました。
              従来の運営方法では対応が困難になっています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: AlertTriangle,
                color: 'text-red-500 bg-red-50',
                title: '本人確認の義務化',
                body: '「事前共有情報との照合」「顔を判別できる録画」が義務に。スタッフ不在のまま従来通りの運営では旅館業法違反になるリスクがあります。',
              },
              {
                icon: FileText,
                color: 'text-orange-500 bg-orange-50',
                title: '宿泊者名簿の電子保存',
                body: '氏名・住所・連絡先に加え、外国人はパスポート情報の取得と3年間の保存が必要。手書き・口頭確認では対応できません。',
              },
              {
                icon: Lock,
                color: 'text-yellow-500 bg-yellow-50',
                title: 'セキュリティリスク',
                body: '暗証番号の使い回し・鍵の番号帳管理は不法侵入のリスク。本人確認なしに解錠できる状態は、宿泊施設の安全を脅かします。',
              },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOLUTION ============ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm tracking-widest mb-3">SOLUTION</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              CheckInnが、すべてを<span className="text-indigo-600">ワンストップ</span>で解決。
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              予約から名簿管理まで、旅館業法対応に必要なプロセスを完全デジタル化。
              スタッフ不在でも、安全・確実なチェックインを実現します。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="features">
            {[
              { icon: Smartphone, title: '事前登録フォーム', body: '予約後にメールで案内。氏名・住所・連絡先・パスポート情報（外国人）をスマホで入力。規約同意も電子取得。' },
              { icon: QrCode, title: 'ワンタイムQR照合', body: '宿泊者に発行したQRと施設設置のQRをペアリング照合。本人以外は入室不可の二段階認証を実現。' },
              { icon: Users, title: '防犯カメラの別途設置を推奨', body: '旅館業法の「顔を判別できる角度での録画」要件は、事業者様が施設に設置する防犯カメラで対応いただきます。CheckInnはその他の本人確認・名簿要件をカバーします。' },
              { icon: FileText, title: '宿泊者名簿の自動生成', body: '入力データから名簿を自動生成。3年間クラウド保存・CSV出力に対応。保健所への提示もすぐに対応可能。' },
              { icon: ShieldCheck, title: '本人確認後に解錠', body: '照合完了後にはじめて暗証番号を発行。RemoteLOCK連携でチェックインと同時にスマートロックを解除。' },
              { icon: Globe, title: '多言語・インバウンド対応', body: '日本語・英語に対応。外国人宿泊者のパスポート番号・国籍・旅券画像も取得・保存できます。' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="group p-6 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPARISON ============ */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm tracking-widest mb-3">WHY CHECKINN</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              他社システムより、<span className="text-indigo-600">圧倒的に低コスト</span>。
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              タブレット設置型・顔認証型は機器代だけで数十万円〜。
              CheckInnはゲスト自身のスマホを使うため、施設側の機器投資はほぼゼロです。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* タブレット設置型 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 text-center">
                <p className="text-sm font-bold text-gray-500 tracking-wide">タブレット設置型</p>
              </div>
              <div className="px-6 py-6 space-y-4">
                {[
                  { label: '初期費用', value: '機器代 数十万円〜', bad: true },
                  { label: '設置工事', value: '電源・固定工事が必要', bad: true },
                  { label: 'ゲストの操作', value: '施設設置の端末を操作', bad: false },
                  { label: '機器の故障リスク', value: '現地機器が壊れると運用停止', bad: true },
                  { label: '法令対応', value: '照合・名簿対応', bad: false },
                ].map(({ label, value, bad }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">{label}</span>
                    <span className={`text-xs font-medium text-right ${bad ? 'text-red-500' : 'text-gray-600'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 顔認証型 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 text-center">
                <p className="text-sm font-bold text-gray-500 tracking-wide">顔認証型</p>
              </div>
              <div className="px-6 py-6 space-y-4">
                {[
                  { label: '初期費用', value: '専用機器 数十万円〜', bad: true },
                  { label: '設置工事', value: 'カメラ・端末の設置が必要', bad: true },
                  { label: 'ゲストの操作', value: '専用機器に顔をかざす', bad: false },
                  { label: '機器の故障リスク', value: '認証機器が壊れると入室不可', bad: true },
                  { label: '法令対応', value: '録画・照合対応', bad: false },
                ].map(({ label, value, bad }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">{label}</span>
                    <span className={`text-xs font-medium text-right ${bad ? 'text-red-500' : 'text-gray-600'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CheckInn */}
            <div className="bg-indigo-600 rounded-2xl border border-indigo-600 overflow-hidden shadow-xl shadow-indigo-200 ring-2 ring-indigo-400">
              <div className="bg-indigo-700 px-6 py-4 text-center flex items-center justify-center gap-2">
                <Star size={14} className="text-yellow-300 fill-yellow-300" />
                <p className="text-sm font-black text-white tracking-wide">CheckInn（QRコード型）</p>
                <Star size={14} className="text-yellow-300 fill-yellow-300" />
              </div>
              <div className="px-6 py-6 space-y-4">
                {[
                  { label: '初期費用', value: '0円（機器不要）' },
                  { label: '設置', value: 'QRコードを印刷して貼るだけ' },
                  { label: 'ゲストの操作', value: '自分のスマホで完結' },
                  { label: '機器の故障リスク', value: 'ゲストのスマホを使うためなし' },
                  { label: '法令対応', value: '照合・名簿・外国人対応すべて' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-indigo-300 shrink-0 mt-0.5">{label}</span>
                    <span className="text-xs font-bold text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="bg-indigo-500/50 rounded-xl px-4 py-3 text-center">
                  <p className="text-white text-xs font-bold">月額費用のみで導入可能</p>
                  <p className="text-indigo-200 text-xs mt-0.5">印刷代だけで今日から運用開始</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            ※他社サービスの費用は各社公開情報をもととした目安です
          </p>
        </div>
      </section>

      {/* ============ FLOW ============ */}
      <section className="py-24 px-6 bg-indigo-950" id="flow">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 font-bold text-sm tracking-widest mb-3">GUEST FLOW</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              宿泊者は、たったこれだけ。
            </h2>
            <p className="text-indigo-300 max-w-xl mx-auto">
              アプリのインストール不要。スマホとメールだけで、すべてのチェックインが完結します。
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '01',
                phase: '予約後（自宅・移動中）',
                title: '事前登録メールが届く',
                body: '予約確定後、CheckInnから事前登録フォームのURLが届きます。氏名・住所・連絡先を入力し、規約に同意するだけ。外国人の方はパスポート情報も登録します。',
                badge: '事前',
                badgeColor: 'bg-blue-500',
              },
              {
                step: '02',
                phase: '登録完了後',
                title: 'チェックイン用QRコードが届く',
                body: '登録が完了すると、チェックイン専用のQRコードリンクがメールで届きます。当日はこのメールをスマホに表示しておくだけでOK。',
                badge: '事前',
                badgeColor: 'bg-blue-500',
              },
              {
                step: '03',
                phase: '施設到着',
                title: '玄関のQRコードをスキャン',
                body: '施設玄関に設置されたQRコードをスマホカメラで読み取ります。アプリ不要。ブラウザが自動で起動します。',
                badge: '当日',
                badgeColor: 'bg-green-500',
              },
              {
                step: '04',
                phase: '本人照合',
                title: 'メールのQRコードをかざす',
                body: '届いたメールのQRリンクを開くと、システムが自動で予約情報と照合。本人確認が完了します。',
                badge: '当日',
                badgeColor: 'bg-green-500',
              },
              {
                step: '05',
                phase: 'チェックイン完了',
                title: '暗証番号が表示される',
                body: '照合完了と同時に暗証番号が画面に表示されます。その番号を入力するだけで入室完了。スタッフ対応は一切不要です。',
                badge: '完了',
                badgeColor: 'bg-indigo-500',
              },
            ].map(({ step, phase, title, body, badge, badgeColor }) => (
              <div key={step} className="flex gap-5 items-start bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-black text-sm">{step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                    <span className="text-indigo-400 text-xs">{phase}</span>
                  </div>
                  <h3 className="text-white font-bold mb-1">{title}</h3>
                  <p className="text-indigo-200 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPLIANCE ============ */}
      <section className="py-24 px-6 bg-white" id="compliance">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm tracking-widest mb-3">COMPLIANCE</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              旅館業法改正に、<span className="text-indigo-600">完全準拠</span>。
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              令和7年4月施行の旅館業衛生等管理要領②の方法に対応。
              保健所への説明資料としてもご活用いただけます。
            </p>
          </div>

          <div className="bg-indigo-50 rounded-2xl overflow-hidden border border-indigo-100">
            <div className="bg-indigo-600 px-6 py-4">
              <p className="text-white font-bold text-sm">旅館業法 要件対応表</p>
            </div>
            <div className="divide-y divide-indigo-100">
              {[
                { req: '事前に本人確認情報・事前共有情報を共有', how: '予約後に登録フォームURLを送付。氏名・住所・連絡先を取得し、チェックイン用QR（事前共有情報）を発行' },
                { req: '施設の自動チェックイン機器等での照合', how: '施設設置QR＋ゲスト保有QRのペアリング照合による本人確認（「等」の解釈に対応）' },
                { req: '顔を判別できる角度での録画', how: '事業者様が施設に設置する防犯カメラで対応（CheckInnは設置の推奨・要件説明をサポート。録画機器は事業者様にてご用意ください）' },
                { req: '鍵は本人確認後のみ交付', how: '照合完了後にはじめて暗証番号を発行。RemoteLOCK連動で本人確認前の解錠を防止' },
                { req: '宿泊者名簿の作成・3年間保存', how: '入力データから名簿を自動生成。クラウドDBに3年間保存・CSV出力対応' },
                { req: '外国人宿泊者の旅券情報取得', how: 'パスポート番号・国籍・旅券画像（JPG/PNG）を取得・暗号化して保存' },
              ].map(({ req, how }) => (
                <div key={req} className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 py-4">
                  <div className="flex gap-2">
                    <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 font-medium">{req}</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{how}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ BEDS24 ============ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-indigo-600 font-bold text-sm tracking-widest mb-3">INTEGRATION</p>
          <h2 className="text-3xl font-black text-gray-900 mb-4">
            Beds24と連携して、予約を自動同期。
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-8">
            Beds24のAPIキーを登録するだけで、物件情報と予約データを自動取得。
            手動入力の手間なく、チェックイン案内メールを自動送信します。
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {['物件情報の自動インポート', '予約の自動同期', '事前登録メールの自動送信', 'チェックイン用QRの自動発行'].map(f => (
              <div key={f} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            今すぐ、無人チェックインを<br className="hidden sm:block" />法令対応に変えましょう。
          </h2>
          <p className="text-indigo-200 mb-10 max-w-xl mx-auto">
            初期費用0円、クレジットカード不要。
            まずは無料でアカウントを作成して、CheckInnをお試しください。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              無料でアカウントを作成
              <ArrowRight size={18} />
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center text-indigo-200 font-medium text-base px-8 py-4 rounded-xl border border-indigo-400 hover:bg-indigo-700 transition-colors">
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white font-black tracking-widest">CheckInn</span>
          <p className="text-gray-500 text-xs">© 2026 CheckInn. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="#" className="hover:text-gray-300 transition-colors">プライバシーポリシー</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">利用規約</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">お問い合わせ</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
