import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-lime-400">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          AIで体型をビジュアル化
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          3ヶ月後の
          <br />
          <span className="text-lime-400">あなた</span>を見る
        </h1>

        <p className="max-w-xl text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
          体重の数字じゃなく、<strong className="text-white">体型の変化</strong>でモチベを維持。
          <br />
          写真1枚から体組成を解析し、目標体型をAIでビジュアル生成。
        </p>

        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-lime-400 text-black font-bold text-lg hover:bg-lime-300 transition-colors"
        >
          無料で体型を解析する
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="mt-4 text-sm text-zinc-500">
          写真はサーバーに保存されません
        </p>
      </section>

      {/* Flow */}
      <section className="px-6 py-20 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-14">
            使い方は<span className="text-lime-400">3ステップ</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs text-lime-400 font-semibold uppercase tracking-widest mb-1">
                    Step {i + 1}
                  </p>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-14">
            BodyVisの<span className="text-lime-400">特徴</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-2xl border border-zinc-800 bg-zinc-950"
              >
                <div className="text-3xl shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-zinc-800 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          まず、今の自分を<br />
          <span className="text-lime-400">数値で知ろう</span>
        </h2>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-lime-400 text-black font-bold text-lg hover:bg-lime-300 transition-colors"
        >
          体型スキャンを始める
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <p className="mt-4 text-sm text-zinc-500">
          利用無料 · 写真は保存されません · 広告なし
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
        <p>© 2026 BodyVis. 写真・個人情報はサーバーに保存されません。</p>
      </footer>
    </main>
  );
}

const steps = [
  {
    icon: "📸",
    title: "写真を撮影",
    desc: "正面・側面の写真と身長・体重・年齢・性別を入力するだけ。",
  },
  {
    icon: "🔬",
    title: "AIが体組成を解析",
    desc: "Bodygramが体脂肪率・筋肉量・ウエストなどを自動計算。",
  },
  {
    icon: "🎯",
    title: "目標体型をビジュアル化",
    desc: "目標値を入力するとGemini AIが3ヶ月後の体型画像を生成。",
  },
];

const features = [
  {
    icon: "🔒",
    title: "写真はサーバーに保存しない",
    desc: "アップロードした写真はAPI解析後に即時廃棄。プライバシーを最優先。",
  },
  {
    icon: "📊",
    title: "体組成にフォーカス",
    desc: "体重の数字ではなく、体脂肪率・筋肉量の変化でリアルな進捗を把握。",
  },
  {
    icon: "🤖",
    title: "AI画像でビフォーアフター",
    desc: "現在と目標の体型を3Dアバターで並べて表示。継続モチベが変わる。",
  },
  {
    icon: "⚡",
    title: "30秒で完了",
    desc: "写真2枚と基本情報を入力するだけ。面倒な登録不要でその場で結果確認。",
  },
];
