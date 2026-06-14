"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BrandHero } from "@/components/brand-hero";

const FAT_PCT_MIN = { male: 5, female: 12 };
const FAT_PCT_MAX = { male: 50, female: 55 };

const fatPresets = {
  male: [
    { label: "シュレッド", value: 7 },
    { label: "リーン", value: 12 },
    { label: "フィット", value: 17 },
    { label: "平均", value: 22 },
    { label: "増量", value: 27 },
  ],
  female: [
    { label: "アスリート", value: 16 },
    { label: "フィット", value: 20 },
    { label: "平均", value: 25 },
    { label: "やや多", value: 30 },
    { label: "増量", value: 35 },
  ],
};

function AdjustContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const gender = (searchParams.get("gender") ?? "male") as "male" | "female";
  const height = searchParams.get("height") ?? "170";
  const currentWeight = parseFloat(searchParams.get("weight") ?? "70");
  const currentFat = parseFloat(searchParams.get("bodyFatPct") ?? "20");
  const currentMuscle = parseFloat(searchParams.get("muscleMass") ?? "30");

  const [targetWeight, setTargetWeight] = useState(
    Math.max(currentWeight - 5, 40)
  );
  const [targetFat, setTargetFat] = useState(
    Math.max(currentFat - 5, FAT_PCT_MIN[gender])
  );

  const targetMuscle = targetWeight * (1 - targetFat / 100) * 0.55;
  const weightDiff = (targetWeight - currentWeight).toFixed(1);
  const fatDiff = (targetFat - currentFat).toFixed(1);
  const muscleDiff = (targetMuscle - currentMuscle).toFixed(1);

  const handleGenerate = () => {
    const params = new URLSearchParams({
      gender,
      height,
      currentWeight: currentWeight.toString(),
      currentFat: currentFat.toString(),
      currentMuscle: currentMuscle.toString(),
      targetWeight: targetWeight.toString(),
      targetFat: targetFat.toString(),
    });
    router.push(`/adjust/generating?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-white lg:flex">
      {/* Left: ブランドエリア（PCでは常時表示） */}
      <div className="px-2 py-13 lg:w-1/2 lg:px-16 lg:py-0 lg:flex lg:items-center lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-violet-50 to-white">
        <BrandHero />
      </div>

      {/* Right: 体型調整 */}
      <div className="px-6 py-12 lg:w-1/2 lg:max-w-none">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-2">Step 3</p>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">体型を調整する</h1>
          <p className="text-slate-500 text-sm">
            スライダーを動かして目標体型を設定してください。
          </p>
        </div>

        {/* Current vs Target comparison */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-400 mb-2">現在</p>
            <p className="text-sm font-bold text-slate-900">{currentWeight} kg</p>
            <p className="text-xs text-slate-500">体脂肪 {currentFat}%</p>
            <p className="text-xs text-slate-500">筋肉量 {currentMuscle.toFixed(1)} kg</p>
          </div>
          <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200">
            <p className="text-xs text-violet-500 mb-2">目標</p>
            <p className="text-sm font-bold text-violet-700">{targetWeight.toFixed(1)} kg</p>
            <p className="text-xs text-violet-600">体脂肪 {targetFat.toFixed(1)}%</p>
            <p className="text-xs text-violet-600">筋肉量 {targetMuscle.toFixed(1)} kg</p>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-8 mb-8">
          {/* Weight slider */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-sm font-semibold text-slate-700">体重</label>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{targetWeight.toFixed(1)}</span>
                <span className="text-sm text-slate-400">kg</span>
                <span className={`text-xs font-medium ml-1 ${parseFloat(weightDiff) < 0 ? "text-emerald-600" : parseFloat(weightDiff) > 0 ? "text-orange-500" : "text-slate-400"}`}>
                  {parseFloat(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg
                </span>
              </div>
            </div>
            <input
              type="range"
              min={Math.max(currentWeight - 30, 30)}
              max={currentWeight + 15}
              step={0.5}
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-600 bg-slate-200"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{Math.max(currentWeight - 30, 30)} kg</span>
              <span>{currentWeight + 15} kg</span>
            </div>
          </div>

          {/* Body fat slider */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-sm font-semibold text-slate-700">体脂肪率</label>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{targetFat.toFixed(1)}</span>
                <span className="text-sm text-slate-400">%</span>
                <span className={`text-xs font-medium ml-1 ${parseFloat(fatDiff) < 0 ? "text-emerald-600" : parseFloat(fatDiff) > 0 ? "text-orange-500" : "text-slate-400"}`}>
                  {parseFloat(fatDiff) > 0 ? `+${fatDiff}` : fatDiff}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={FAT_PCT_MIN[gender]}
              max={FAT_PCT_MAX[gender]}
              step={0.5}
              value={targetFat}
              onChange={(e) => setTargetFat(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-600 bg-slate-200"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{FAT_PCT_MIN[gender]}%</span>
              <span>{FAT_PCT_MAX[gender]}%</span>
            </div>

            {/* Fat presets */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {fatPresets[gender].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setTargetFat(p.value)}
                  className={`py-1.5 rounded-lg text-center text-xs transition-colors ${
                    Math.abs(targetFat - p.value) < 0.5
                      ? "bg-violet-100 text-violet-700 font-semibold border border-violet-300"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <p className="font-bold">{p.value}%</p>
                  <p className="text-[10px] mt-0.5">{p.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Muscle mass (derived, read-only) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">筋肉量（推定）</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{targetMuscle.toFixed(1)}</span>
                <span className="text-sm text-slate-400">kg</span>
                <span className={`text-xs font-medium ml-1 ${parseFloat(muscleDiff) >= 0 ? "text-emerald-600" : "text-orange-500"}`}>
                  {parseFloat(muscleDiff) >= 0 ? `+${muscleDiff}` : muscleDiff} kg
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">体重・体脂肪率から自動計算</p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base hover:opacity-90 transition-opacity shadow-md shadow-violet-100"
        >
          この体型でビジュアル生成 →
        </button>

        <button
          onClick={() => router.back()}
          className="block w-full text-center mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← 戻る
        </button>
      </div>
      </div>
    </main>
  );
}

export default function AdjustPage() {
  return (
    <Suspense>
      <AdjustContent />
    </Suspense>
  );
}
