export function BrandHero() {
  return (
    <div className="text-center lg:text-left">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        AIで体型変化をビジュアル化
      </div>
      <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
        BodyVis
      </h1>
      <p className="max-w-xl mx-auto lg:mx-0 text-slate-500 text-sm leading-relaxed">
        写真と基本情報を入力するだけで体型データを自動推定。
        <br />
        服の画像を選ぶだけで、AIがあなたに試着させたイメージを生成。
      </p>
    </div>
  );
}
