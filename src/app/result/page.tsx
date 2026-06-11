"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clearGeneratedImages, loadGeneratedImages } from "@/lib/generated-image-storage";

function ResultContent() {
  const searchParams = useSearchParams();
  const [images] = useState<{ currentImage: string; goalImage: string } | null>(() =>
    typeof window === "undefined" ? null : loadGeneratedImages()
  );

  useEffect(() => {
    return () => clearGeneratedImages();
  }, []);

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
    <main className="min-h-screen px-6 py-12 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-2">Result</p>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">ビジュアル生成完了</h1>
          <p className="text-slate-500 text-sm">
            AIが予測した体型ビジュアルです。参考値として活用してください。
          </p>
        </div>

        {/* Before / After images */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <AvatarCard
            label="現在"
            sublabel={`${currentWeight} kg · ${currentFat}%`}
            isTarget={false}
            emoji={gender === "male" ? "🧍‍♂️" : "🧍‍♀️"}
            fat={currentFat}
            image={images?.currentImage}
          />
          <AvatarCard
            label="目標"
            sublabel={`${targetWeight} kg · ${targetFat}%`}
            isTarget={true}
            emoji={gender === "male" ? "🏋️‍♂️" : "🏋️‍♀️"}
            fat={targetFat}
            image={images?.goalImage}
          />
        </div>

        {/* Diff summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <DiffCard label="体重" diff={`-${weightDiff} kg`} positive={parseFloat(weightDiff) > 0} />
          <DiffCard label="体脂肪率" diff={`-${fatDiff}%`} positive={parseFloat(fatDiff) > 0} />
          <DiffCard
            label="筋肉量"
            diff={parseFloat(muscleDiff) >= 0 ? `+${muscleDiff} kg` : `${muscleDiff} kg`}
            positive={parseFloat(muscleDiff) >= 0}
          />
        </div>

        {/* Body composition comparison */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-8">
          <h2 className="font-bold mb-5 text-slate-900">体組成の比較</h2>
          <div className="space-y-4">
            <CompareBar label="体脂肪率" before={currentFat} after={targetFat} max={gender === "male" ? 40 : 50} unit="%" />
            <CompareBar label="筋肉量" before={currentMuscle} after={targetMuscle} max={gender === "male" ? 60 : 45} unit="kg" higherIsBetter />
            <CompareBar label="体重" before={currentWeight} after={targetWeight} max={150} unit="kg" />
          </div>
        </div>

        {/* Try-on optional CTA（一旦非表示） */}
        {/* <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-8 text-center">
          <p className="text-sm font-semibold text-slate-700 mb-1">👕 バーチャル試着（オプション）</p>
          <p className="text-xs text-slate-500 mb-3">服の画像をアップロードして目標体型での試着イメージを生成</p>
          <Link
            href="/try-on"
            className="inline-block py-2 px-6 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            試着してみる
          </Link>
        </div> */}

        <p className="text-xs text-slate-300 text-center mb-8">
          ※ 表示されているアバター画像はAIによる参考イメージです。実際の体型変化とは異なる場合があります。
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/adjust"
            className="py-4 rounded-full border border-slate-200 text-slate-700 font-medium text-sm text-center hover:bg-slate-50 transition-colors"
          >
            調整し直す
          </Link>
          <Link
            href="/"
            className="py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm text-center hover:opacity-90 transition-opacity"
          >
            もう一度スキャン
          </Link>
        </div>
      </div>
    </main>
  );
}

function AvatarCard({
  label, sublabel, isTarget, emoji, fat, image,
}: {
  label: string; sublabel: string; isTarget: boolean; emoji: string; fat: number; image?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${isTarget ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isTarget ? "text-violet-600" : "text-slate-400"}`}>
        {label}
      </p>
      <div className={`relative w-full aspect-[2/3] rounded-xl flex flex-col items-center justify-center mb-3 overflow-hidden ${isTarget ? "bg-violet-100" : "bg-slate-200"}`}>
        {image ? (
          <Image src={image} alt={label} fill className="object-cover" unoptimized />
        ) : (
          <>
            <span className="text-6xl">{emoji}</span>
            <div className="mt-3 w-16 h-2 rounded-full bg-white/50 overflow-hidden">
              <div
                className={`h-full rounded-full ${isTarget ? "bg-violet-500" : "bg-slate-400"}`}
                style={{ width: `${Math.max(10, 100 - fat * 2)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">体脂肪 {fat}%</p>
          </>
        )}
      </div>
      <p className={`text-sm font-medium ${isTarget ? "text-violet-700" : "text-slate-600"}`}>{sublabel}</p>
    </div>
  );
}

function DiffCard({ label, diff, positive }: { label: string; diff: string; positive: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${positive ? "text-emerald-600" : "text-orange-500"}`}>{diff}</p>
    </div>
  );
}

function CompareBar({
  label, before, after, max, unit, higherIsBetter = false,
}: {
  label: string; before: number; after: number; max: number; unit: string; higherIsBetter?: boolean;
}) {
  const improved = higherIsBetter ? after > before : after < before;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-500">{label}</span>
        <span className={improved ? "text-emerald-600 font-medium" : "text-slate-600"}>
          {before} → {after.toFixed(1)} {unit}
        </span>
      </div>
      <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="absolute h-full bg-slate-300 rounded-full transition-all" style={{ width: `${(before / max) * 100}%` }} />
        <div
          className={`absolute h-full rounded-full transition-all ${improved ? "bg-violet-500" : "bg-orange-400"}`}
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
