"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function getFatCategory(gender: string, pct: number): { label: string; color: string } {
  if (gender === "male") {
    if (pct < 10) return { label: "アスリート", color: "text-blue-400" };
    if (pct < 15) return { label: "リーンアスリート", color: "text-lime-400" };
    if (pct < 20) return { label: "フィット", color: "text-green-400" };
    if (pct < 25) return { label: "平均的", color: "text-yellow-400" };
    return { label: "要注意", color: "text-orange-400" };
  } else {
    if (pct < 18) return { label: "アスリート", color: "text-blue-400" };
    if (pct < 22) return { label: "フィット", color: "text-lime-400" };
    if (pct < 28) return { label: "平均的", color: "text-green-400" };
    if (pct < 35) return { label: "やや多め", color: "text-yellow-400" };
    return { label: "要注意", color: "text-orange-400" };
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
    });
    if (bodyFatPct !== undefined) params.set("bodyFatPct", bodyFatPct.toString());
    if (muscleMass !== undefined) params.set("muscleMass", muscleMass.toString());
    router.push(`/goal?${params.toString()}`);
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <p className="text-xs text-lime-400 font-semibold uppercase tracking-widest mb-2">Step 2</p>
          <h1 className="text-3xl font-bold mb-2">スキャン結果</h1>
          <p className="text-zinc-400 text-sm">
            {gender === "male" ? "男性" : "女性"} · {age}歳 · {height}cm · {weight}kg
          </p>
        </div>

        {/* Fat category badge */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center mb-6">
          <p className="text-xs text-zinc-500 mb-2">体型カテゴリ</p>
          {fatCategory ? (
            <>
              <p className={`text-4xl font-bold mb-1 ${fatCategory.color}`}>{fatCategory.label}</p>
              <p className="text-sm text-zinc-400">体脂肪率 {bodyFatPct}%</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-zinc-500">データなし</p>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <MetricCard
            label="体脂肪率"
            value={bodyFatPct !== undefined ? `${bodyFatPct}%` : "—"}
            sub="Bodygram解析値"
            highlight={fatCategory?.color}
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
            sub="推定値"
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
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 mb-8">
          <p className="text-white font-medium mb-1">📌 数値について</p>
          <p>
            これらはBodygram AIによる推定値です。医療診断ではありません。
            実際の体組成計や医師による計測と異なる場合があります。
          </p>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 rounded-full bg-lime-400 text-black font-bold text-base hover:bg-lime-300 transition-colors"
        >
          目標を設定する →
        </button>

        <Link
          href="/scan"
          className="block text-center mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          撮り直す
        </Link>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-0.5 ${highlight ?? "text-white"}`}>{value}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
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
