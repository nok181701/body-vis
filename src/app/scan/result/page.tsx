"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrandHero } from "@/components/brand-hero";

function getFatCategory(gender: string, pct: number): { label: string; color: string } {
  if (gender === "male") {
    if (pct < 10) return { label: "アスリート", color: "text-sky-600" };
    if (pct < 15) return { label: "リーンアスリート", color: "text-violet-600" };
    if (pct < 20) return { label: "フィット", color: "text-emerald-600" };
    if (pct < 25) return { label: "平均的", color: "text-amber-600" };
    return { label: "要注意", color: "text-orange-600" };
  } else {
    if (pct < 18) return { label: "アスリート", color: "text-sky-600" };
    if (pct < 22) return { label: "フィット", color: "text-violet-600" };
    if (pct < 28) return { label: "平均的", color: "text-emerald-600" };
    if (pct < 35) return { label: "やや多め", color: "text-amber-600" };
    return { label: "要注意", color: "text-orange-600" };
  }
}

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
  const bodyFatPct = parseOptional("bodyFatPct");
  const muscleMass = parseOptional("muscleMass");
  const waist = parseOptional("waist");
  const shoulderWidth = parseOptional("shoulderWidth");

  const bmi = weight / ((height / 100) ** 2);
  const fatCategory = bodyFatPct !== undefined ? getFatCategory(gender, bodyFatPct) : null;

  const handleNext = () => {
    const params = new URLSearchParams({
      gender,
      height: height.toString(),
      weight: weight.toString(),
      age: age.toString(),
    });
    if (bodyFatPct !== undefined) params.set("bodyFatPct", bodyFatPct.toString());
    if (muscleMass !== undefined) params.set("muscleMass", muscleMass.toString());
    if (waist !== undefined) params.set("waist", waist.toString());
    if (shoulderWidth !== undefined) params.set("shoulderWidth", shoulderWidth.toString());
    router.push(`/try-on?${params.toString()}`);
  };

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

        {/* Fat category badge */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center mb-6">
          <p className="text-xs text-slate-400 mb-2">体型カテゴリ</p>
          {fatCategory ? (
            <>
              <p className={`text-4xl font-bold mb-1 ${fatCategory.color}`}>{fatCategory.label}</p>
              <p className="text-sm text-slate-500">体脂肪率 {bodyFatPct}%</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-300">データなし</p>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <MetricCard
            label="体脂肪率"
            value={bodyFatPct !== undefined ? `${bodyFatPct}%` : "—"}
            sub="MediaPipe推定値"
            accent={!!fatCategory}
          />
          <MetricCard
            label="筋肉量"
            value={muscleMass !== undefined ? `${muscleMass} kg` : "—"}
            sub="推定値"
          />
          <MetricCard
            label="BMI"
            value={bmi.toFixed(1)}
            sub={bmi < 18.5 ? "低体重" : bmi < 25 ? "普通" : bmi < 30 ? "過体重" : "肥満"}
          />
          <MetricCard
            label="ウエスト"
            value={waist !== undefined ? `${waist} cm` : "—"}
            sub="推定値"
          />
          <MetricCard
            label="肩幅"
            value={shoulderWidth !== undefined ? `${shoulderWidth} cm` : "—"}
            sub="MediaPipe計測"
          />
          <MetricCard
            label="除脂肪体重"
            value={
              bodyFatPct !== undefined
                ? `${(weight * (1 - bodyFatPct / 100)).toFixed(1)} kg`
                : "—"
            }
            sub="脂肪以外の体重"
          />
        </div>

        {/* Note */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 mb-8">
          <p className="text-slate-700 font-medium mb-1">📌 数値について</p>
          <p>
            MediaPipe + AIモデルによる推定値です。医療診断ではありません。
            実際の体組成計や医師による計測と異なる場合があります。
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

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-0.5 ${accent ? "text-violet-600" : "text-slate-900"}`}>{value}</p>
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
