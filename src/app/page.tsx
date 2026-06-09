import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center bg-gradient-to-b from-violet-50 to-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          AIで体型変化をビジュアル化
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
          なりたい体型を
          <br />
          <span className="text-violet-600">動かして実感</span>
        </h1>

        <p className="max-w-xl text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
          写真1枚から体型データを自動推定。
          <br />
          <strong className="text-slate-700">スライダーを動かすだけ</strong>で、AIが変化後の姿をビジュアル生成。
        </p>

        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-violet-200"
        >
          無料でスキャンする
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="mt-4 text-sm text-slate-400">
          写真はブラウザ上で処理、サーバーに保存されません
        </p>
      </section>

      {/* Flow */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-14 text-slate-900">
            使い方は<span className="text-violet-600">3ステップ</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-1">
                    Step {i + 1}
                  </p>
                  <h3 className="font-bold text-lg mb-2 text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-14 text-slate-900">
            BodyVisの<span className="text-violet-600">特徴</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="text-3xl shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold mb-1 text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-white text-center border-t border-slate-100">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
          まず、今の自分を<br />
          <span className="text-violet-600">数値で知ろう</span>
        </h2>
        <p className="text-slate-500 mb-8">登録不要・完全無料・30秒で完了</p>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-violet-200"
        >
          体型スキャンを始める
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-100 text-center text-sm text-slate-400">
        <p>© 2026 BodyVis. 写真・個人情報はサーバーに保存されません。</p>
      </footer>
    </main>
  );
}

const steps = [
  {
    icon: "📸",
    title: "写真を撮影",
    desc: "正面写真1枚と身長・体重・年齢を入力するだけ。写真はブラウザ上で処理されます。",
  },
  {
    icon: "📊",
    title: "体型データを推定",
    desc: "MediaPipe AIが体脂肪率・筋肉量・ウエストなどを自動計算。",
  },
  {
    icon: "🎯",
    title: "スライダーで体型を変える",
    desc: "目標の体重・体脂肪率をスライダーで設定すると、AIが変化後の姿をビジュアル生成。",
  },
];

const features = [
  {
    icon: "🔒",
    title: "写真はブラウザ完結",
    desc: "写真解析はすべてブラウザ内で実行。サーバーには送信も保存もされません。",
  },
  {
    icon: "🎚️",
    title: "スライダーで直感操作",
    desc: "体重・体脂肪率をスライダーで動かすだけ。数値入力不要で誰でも簡単。",
  },
  {
    icon: "🤖",
    title: "Gemini AIでビジュアル生成",
    desc: "設定した目標体型をGemini AIが3Dアバターイメージで生成。",
  },
  {
    icon: "👕",
    title: "バーチャル試着（オプション）",
    desc: "服の画像をアップロードすると、目標体型での試着イメージをAIが生成。",
  },
];
