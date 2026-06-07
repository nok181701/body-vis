"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResultContent() {
  const searchParams = useSearchParams();

  const gender = searchParams.get("gender") ?? "male";
  const currentWeight = parseFloat(searchParams.get("currentWeight") ?? "70");
  const currentFat = parseFloat(searchParams.get("currentFat") ?? "20");
  const currentMuscle = parseFloat(searchParams.get("currentMuscle") ?? "30");
  const targetWeight = parseFloat(searchParams.get("targetWeight") ?? "65");
  const targetFat = parseFloat(searchParams.get("targetFat") ?? "15");
  const currentLeanMass = currentWeight * (1 - currentFat / 100);
  const muscleRatio = currentMuscle / (currentLeanMass || 1);
  const targetLeanMass = targetWeight * (1 - targetFat / 100);
  const targetMuscle = targetLeanMass * muscleRatio;

  const fatDiff = (currentFat - targetFat).toFixed(1);
  const weightDiff = (currentWeight - targetWeight).toFixed(1);
  const muscleDiff = (targetMuscle - currentMuscle).toFixed(1);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-xs text-lime-400 font-semibold uppercase tracking-widest mb-2">Result</p>
          <h1 className="text-3xl font-bold mb-2">3ヶ月後のあなた</h1>
          <p className="text-zinc-400 text-sm">
            AIが予測した体型ビジュアルです。参考値として活用してください。
          </p>
        </div>

        {/* Before / After images */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <AvatarCard
            label="現在"
            sublabel={`${currentWeight} kg · ${currentFat}%`}
            color="zinc"
            emoji={gender === "male" ? "🧍‍♂️" : "🧍‍♀️"}
            fat={currentFat}
          />
          <AvatarCard
            label="目標"
            sublabel={`${targetWeight} kg · ${targetFat}%`}
            color="lime"
            emoji={gender === "male" ? "🏋️‍♂️" : "🏋️‍♀️"}
            fat={targetFat}
          />
        </div>

        {/* Diff summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <DiffCard
            label="体重"
            diff={`-${weightDiff} kg`}
            isPositive={parseFloat(weightDiff) > 0}
          />
          <DiffCard
            label="体脂肪率"
            diff={`-${fatDiff}%`}
            isPositive={parseFloat(fatDiff) > 0}
          />
          <DiffCard
            label="筋肉量"
            diff={parseFloat(muscleDiff) >= 0 ? `+${muscleDiff} kg` : `${muscleDiff} kg`}
            isPositive={parseFloat(muscleDiff) >= 0}
          />
        </div>

        {/* Body composition comparison */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 mb-8">
          <h2 className="font-bold mb-5">体組成の比較</h2>
          <div className="space-y-4">
            <CompareBar
              label="体脂肪率"
              before={currentFat}
              after={targetFat}
              max={gender === "male" ? 40 : 50}
              unit="%"
            />
            <CompareBar
              label="筋肉量"
              before={currentMuscle}
              after={targetMuscle}
              max={gender === "male" ? 60 : 45}
              unit="kg"
              higherIsBetter
            />
            <CompareBar
              label="体重"
              before={currentWeight}
              after={targetWeight}
              max={150}
              unit="kg"
            />
          </div>
        </div>

        {/* Tips */}
        <div className="p-5 rounded-2xl border border-lime-400/20 bg-lime-400/5 mb-8">
          <h3 className="font-bold text-lime-400 mb-3">目標達成のヒント</h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span>💪</span>
              <span>週3〜4回の筋トレで筋肉量を維持しながら減脂を目指しましょう</span>
            </li>
            <li className="flex gap-2">
              <span>🥗</span>
              <span>タンパク質を体重×1.5〜2gを目標に摂取してください</span>
            </li>
            <li className="flex gap-2">
              <span>📉</span>
              <span>
                月{((parseFloat(weightDiff)) / 3).toFixed(1)} kgペースで3ヶ月かけて達成するのが健康的です
              </span>
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-zinc-600 text-center mb-8">
          ※ 表示されているアバター画像はAIによる参考イメージです。実際の体型変化とは異なる場合があります。
          医療・栄養の専門家にご相談ください。
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/scan"
            className="py-4 rounded-full border border-zinc-700 text-white font-medium text-sm text-center hover:border-zinc-500 transition-colors"
          >
            もう一度スキャン
          </Link>
          <Link
            href="/"
            className="py-4 rounded-full bg-lime-400 text-black font-bold text-sm text-center hover:bg-lime-300 transition-colors"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

function AvatarCard({
  label,
  sublabel,
  color,
  emoji,
  fat,
}: {
  label: string;
  sublabel: string;
  color: "zinc" | "lime";
  emoji: string;
  fat: number;
}) {
  const isLime = color === "lime";
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        isLime ? "border-lime-400/30 bg-lime-400/5" : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isLime ? "text-lime-400" : "text-zinc-400"}`}>
        {label}
      </p>
      {/* Placeholder avatar */}
      <div
        className={`w-full aspect-[2/3] rounded-xl flex flex-col items-center justify-center mb-3 ${
          isLime ? "bg-lime-400/10" : "bg-zinc-800"
        }`}
      >
        <span className="text-6xl">{emoji}</span>
        <div className="mt-3 w-16 h-2 rounded-full bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full ${isLime ? "bg-lime-400" : "bg-zinc-500"}`}
            style={{ width: `${Math.max(10, 100 - fat * 2)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">体脂肪 {fat}%</p>
      </div>
      <p className={`text-sm font-medium ${isLime ? "text-lime-400" : "text-zinc-300"}`}>{sublabel}</p>
    </div>
  );
}

function DiffCard({
  label,
  diff,
  isPositive,
}: {
  label: string;
  diff: string;
  isPositive: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${isPositive ? "text-lime-400" : "text-red-400"}`}>{diff}</p>
    </div>
  );
}

function CompareBar({
  label,
  before,
  after,
  max,
  unit,
  higherIsBetter = false,
}: {
  label: string;
  before: number;
  after: number;
  max: number;
  unit: string;
  higherIsBetter?: boolean;
}) {
  const improved = higherIsBetter ? after > before : after < before;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-zinc-400">{label}</span>
        <span className={improved ? "text-lime-400" : "text-zinc-300"}>
          {before} → {after.toFixed(1)} {unit}
        </span>
      </div>
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-zinc-600 rounded-full transition-all"
          style={{ width: `${(before / max) * 100}%` }}
        />
        <div
          className={`absolute h-full rounded-full transition-all ${improved ? "bg-lime-400" : "bg-orange-400"}`}
          style={{ width: `${(after / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
