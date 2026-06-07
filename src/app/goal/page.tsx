"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const FAT_PCT_MIN = { male: 5, female: 12 };
const FAT_PCT_MAX = { male: 50, female: 55 };

function GoalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const gender = (searchParams.get("gender") ?? "male") as "male" | "female";
  const currentWeight = parseFloat(searchParams.get("weight") ?? "70");
  const currentFat = parseFloat(searchParams.get("bodyFatPct") ?? "20");
  const currentMuscle = parseFloat(searchParams.get("muscleMass") ?? "30");
  const height = searchParams.get("height") ?? "170";

  const [targetWeight, setTargetWeight] = useState(
    Math.max(currentWeight - 5, 40).toString()
  );
  const [targetFat, setTargetFat] = useState(
    Math.max(currentFat - 5, FAT_PCT_MIN[gender]).toString()
  );
  const [errors, setErrors] = useState<{ weight?: string; fat?: string }>({});

  const targetWeightNum = parseFloat(targetWeight);
  const targetFatNum = parseFloat(targetFat);

  const fatDiff = currentFat - targetFatNum;
  const weightDiff = currentWeight - targetWeightNum;

  const validate = () => {
    const errs: typeof errors = {};
    if (isNaN(targetWeightNum) || targetWeightNum < 30 || targetWeightNum > 200)
      errs.weight = "目標体重を正しく入力してください（30〜200kg）";
    if (
      isNaN(targetFatNum) ||
      targetFatNum < FAT_PCT_MIN[gender] ||
      targetFatNum > FAT_PCT_MAX[gender]
    )
      errs.fat = `体脂肪率は${FAT_PCT_MIN[gender]}〜${FAT_PCT_MAX[gender]}%で入力してください`;
    if (!isNaN(targetWeightNum) && targetWeightNum > currentWeight + 20)
      errs.weight = "目標体重が現在より20kg以上多い場合は対応しません";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const params = new URLSearchParams({
      gender,
      height,
      currentWeight: currentWeight.toString(),
      currentFat: currentFat.toString(),
      currentMuscle: currentMuscle.toString(),
      targetWeight,
      targetFat,
    });
    router.push(`/goal/generating?${params.toString()}`);
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <p className="text-xs text-lime-400 font-semibold uppercase tracking-widest mb-2">Step 3</p>
          <h1 className="text-3xl font-bold mb-2">目標を設定</h1>
          <p className="text-zinc-400 text-sm">
            現在の体型から目標値を決めましょう。現実的な数値がおすすめです。
          </p>
        </div>

        {/* Current stats */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 mb-8">
          <p className="text-xs text-zinc-500 mb-3">現在の体型</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-lime-400">{currentWeight} kg</p>
              <p className="text-xs text-zinc-500">体重</p>
            </div>
            <div>
              <p className="text-xl font-bold text-lime-400">{currentFat}%</p>
              <p className="text-xs text-zinc-500">体脂肪率</p>
            </div>
            <div>
              <p className="text-xl font-bold text-lime-400">{currentMuscle} kg</p>
              <p className="text-xs text-zinc-500">筋肉量</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target weight */}
          <div>
            <label className="block text-sm font-medium mb-2">
              目標体重
              <span className="ml-2 text-xs text-zinc-500 font-normal">
                (現在 {currentWeight} kg)
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border text-lg outline-none focus:border-lime-400 transition-colors ${
                  errors.weight ? "border-red-500/50" : "border-zinc-800"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">kg</span>
            </div>
            {!isNaN(weightDiff) && weightDiff !== 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {weightDiff > 0 ? `${weightDiff.toFixed(1)} kg 減` : `${Math.abs(weightDiff).toFixed(1)} kg 増`}
              </p>
            )}
            {errors.weight && <p className="mt-1 text-xs text-red-400">{errors.weight}</p>}
          </div>

          {/* Target body fat */}
          <div>
            <label className="block text-sm font-medium mb-2">
              目標体脂肪率
              <span className="ml-2 text-xs text-zinc-500 font-normal">
                (現在 {currentFat}%)
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={targetFat}
                onChange={(e) => setTargetFat(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border text-lg outline-none focus:border-lime-400 transition-colors ${
                  errors.fat ? "border-red-500/50" : "border-zinc-800"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">%</span>
            </div>
            {!isNaN(fatDiff) && fatDiff !== 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {fatDiff > 0 ? `${fatDiff.toFixed(1)}% 減` : `${Math.abs(fatDiff).toFixed(1)}% 増`}
              </p>
            )}
            {errors.fat && <p className="mt-1 text-xs text-red-400">{errors.fat}</p>}

            {/* Fat reference */}
            <div className="mt-3 grid grid-cols-5 gap-1">
              {(gender === "male" ? maleFatRanges : femaleFatRanges).map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setTargetFat(r.value.toString())}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-lime-400/50 text-center transition-colors"
                >
                  <p className="text-xs font-bold text-lime-400">{r.value}%</p>
                  <p className="text-[10px] text-zinc-500">{r.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview change */}
          {!isNaN(targetFatNum) && !isNaN(targetWeightNum) && (
            <div className="p-4 rounded-xl bg-lime-400/10 border border-lime-400/20 text-sm">
              <p className="font-medium text-lime-400 mb-1">目標達成後の体型</p>
              <p className="text-zinc-300">
                体重 {targetWeightNum} kg ·  体脂肪率 {targetFatNum}% ·{" "}
                推定筋肉量 {(targetWeightNum * (1 - targetFatNum / 100)).toFixed(1)} kg
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-full bg-lime-400 text-black font-bold text-base hover:bg-lime-300 transition-colors"
          >
            目標体型をAI生成する →
          </button>

          <Link
            href="/scan"
            className="block text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← スキャンに戻る
          </Link>
        </form>
      </div>
    </main>
  );
}

const maleFatRanges = [
  { label: "シュレッド", value: 7 },
  { label: "リーン", value: 12 },
  { label: "フィット", value: 17 },
  { label: "平均", value: 22 },
  { label: "増量", value: 27 },
];

const femaleFatRanges = [
  { label: "アスリート", value: 16 },
  { label: "フィット", value: 20 },
  { label: "平均", value: 25 },
  { label: "やや多", value: 30 },
  { label: "増量", value: 35 },
];

export default function GoalPage() {
  return (
    <Suspense>
      <GoalContent />
    </Suspense>
  );
}
