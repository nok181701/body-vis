"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrandHero } from "@/components/brand-hero";

function ScanResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const parseOptional = (key: string): number | undefined => {
    const raw = searchParams.get(key);
    if (raw === null) return undefined;
    const value = parseFloat(raw);
    return isNaN(value) ? undefined : value;
  };

  const gender = searchParams.get("gender") ?? "male";
  const height = parseFloat(searchParams.get("height") ?? "170");
  const weight = parseFloat(searchParams.get("weight") ?? "70");
  const age = parseInt(searchParams.get("age") ?? "25");
  const shoulderWidth = parseOptional("shoulderWidth");
  const bustGirth = parseOptional("bustGirth");
  const waist = parseOptional("waist");
  const hipGirth = parseOptional("hipGirth");
  const insideLegHeight = parseOptional("insideLegHeight");
  const sleeveLength = parseOptional("sleeveLength");
  const neckGirth = parseOptional("neckGirth");

  const handleNext = () => {
    const params = new URLSearchParams({
      gender,
      height: height.toString(),
      weight: weight.toString(),
      age: age.toString(),
    });
    if (shoulderWidth !== undefined) params.set("shoulderWidth", shoulderWidth.toString());
    if (bustGirth !== undefined) params.set("bustGirth", bustGirth.toString());
    if (waist !== undefined) params.set("waist", waist.toString());
    if (hipGirth !== undefined) params.set("hipGirth", hipGirth.toString());
    if (insideLegHeight !== undefined) params.set("insideLegHeight", insideLegHeight.toString());
    if (sleeveLength !== undefined) params.set("sleeveLength", sleeveLength.toString());
    if (neckGirth !== undefined) params.set("neckGirth", neckGirth.toString());
    router.push(`/try-on?${params.toString()}`);
  };

  const fmt = (v: number | undefined) =>
    v !== undefined ? `${v} cm` : "—";

  return (
    <main className="min-h-screen bg-white lg:flex">
      {/* Left: ブランドエリア（PCでは常時表示） */}
      <div className="px-2 py-13 lg:w-1/2 lg:px-16 lg:py-0 lg:flex lg:items-center lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-violet-50 to-white">
        <BrandHero />
      </div>

      {/* Right: スキャン結果 */}
      <div className="px-6 py-12 lg:w-1/2 lg:max-w-none">
        <div className="max-w-lg mx-auto">
          <div className="mb-10">
            <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-2">Step 2</p>
            <h1 className="text-3xl font-bold mb-2 text-slate-900">スキャン結果</h1>
            <p className="text-slate-500 text-sm">
              {gender === "male" ? "男性" : "女性"} · {age}歳 · {height}cm · {weight}kg
            </p>
          </div>

          {/* 測定値グリッド */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MetricCard label="身長" value={`${height} cm`} sub="入力値" />
            <MetricCard label="肩幅" value={fmt(shoulderWidth)} sub="MediaPipe計測" />
            <MetricCard label="胸囲" value={fmt(bustGirth)} sub="推定値" />
            <MetricCard label="ウエスト" value={fmt(waist)} sub="推定値" />
            <MetricCard label="ヒップ" value={fmt(hipGirth)} sub="推定値" />
            <MetricCard label="股下" value={fmt(insideLegHeight)} sub="MediaPipe計測" />
            <MetricCard label="袖丈" value={fmt(sleeveLength)} sub="MediaPipe計測" />
            <MetricCard label="首回り" value={fmt(neckGirth)} sub="推定値" />
          </div>

          {/* 計測ロジック */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">計測ロジック</p>
            <div className="space-y-4">
              <LogicRow
                label="身長"
                badge="入力値"
                description="ユーザーが入力した身長をそのまま使用"
              />
              <LogicRow
                label="肩幅"
                badge="MediaPipe"
                description="姿勢推定で検出した肩関節ランドマーク座標に、アスペクト比補正・ランドマーク補正係数（×1.37）を適用して算出"
              />
              <LogicRow
                label="胸囲"
                badge="推定式"
                description="肩幅から胸幅を推定（男×0.87 / 女×0.78）し、楕円断面近似（奥行き比: 男0.68 / 女0.88）で周長に変換"
              />
              <LogicRow
                label="ウエスト"
                badge="推定式"
                description="BMIからウエスト身長比（WHtR）を推定し身長と掛け合わせて算出。腹囲を直接入力した場合はその値を使用"
              />
              <LogicRow
                label="ヒップ"
                badge="MediaPipe"
                description="腰関節ランドマーク幅比率から実寸幅を推定し、楕円断面近似（奥行き比: 男0.82 / 女0.90）で周長に変換"
              />
              <LogicRow
                label="股下"
                badge="MediaPipe"
                description="腰〜足首のY座標比率を身長にスケールし、腰関節〜股下オフセット（5cm）を減算して算出"
              />
              <LogicRow
                label="袖丈"
                badge="MediaPipe"
                description="肩〜手首のユークリッド距離比率を身長にスケールし、後頸点〜肩峰オフセット（8cm）を加算。手首が写っていない場合は身長×0.33のフォールバック"
              />
              <LogicRow
                label="首回り"
                badge="推定式"
                description="首回りを直接入力した場合はその値を使用。未入力の場合は身長比（男×0.197 / 女×0.168）＋BMI補正で推定"
              />
            </div>
          </div>

          {/* Note */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 mb-8">
            <p className="text-slate-700 font-medium mb-1">📌 数値について</p>
            <p>
              MediaPipe + 統計式による推定値です。医療診断ではありません。
              実際の採寸値と異なる場合があります。
            </p>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base hover:opacity-90 transition-opacity shadow-md shadow-violet-100"
          >
            試着する服を選ぶ →
          </button>

          <Link
            href="/"
            className="block text-center mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            撮り直す
          </Link>
        </div>
      </div>
    </main>
  );
}

function LogicRow({
  label,
  badge,
  description,
}: {
  label: string;
  badge: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
          {badge}
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold mb-0.5 text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

export default function ScanResultPage() {
  return (
    <Suspense>
      <ScanResultContent />
    </Suspense>
  );
}
