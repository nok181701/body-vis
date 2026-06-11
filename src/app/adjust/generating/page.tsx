"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { clearScanPhotos, loadScanPhotos } from "@/lib/scan-photo-storage";
import { saveGeneratedImages } from "@/lib/generated-image-storage";
import { generateAvatar } from "@/lib/gemini/generate-avatar";
import type { Gender } from "@/lib/gemini/avatar-prompt";

const STEPS = [
  { label: "体組成データを送信中..." },
  { label: "目標体型アバターを生成中..." },
  { label: "画像を最終調整中..." },
];

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    const photos = loadScanPhotos();
    if (!photos) {
      router.replace("/scan");
      return;
    }

    const gender = (searchParams.get("gender") ?? "male") as Gender;
    const height = parseFloat(searchParams.get("height") ?? "170");
    const currentFat = parseFloat(searchParams.get("currentFat") ?? "20");
    const targetFat = parseFloat(searchParams.get("targetFat") ?? "15");
    const currentWeight = parseFloat(searchParams.get("currentWeight") ?? "70");
    const targetWeight = parseFloat(searchParams.get("targetWeight") ?? "65");

    const params = new URLSearchParams({
      gender,
      height: height.toString(),
      currentWeight: searchParams.get("currentWeight") ?? "70",
      currentFat: currentFat.toString(),
      currentMuscle: searchParams.get("currentMuscle") ?? "30",
      targetWeight: searchParams.get("targetWeight") ?? "65",
      targetFat: targetFat.toString(),
    });

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 95));
    }, 150);

    (async () => {
      setStepIndex(0);

      setStepIndex(1);
      const goalResult = await generateAvatar({
        photo: photos.front,
        gender,
        height,
        bodyFatPct: targetFat,
        weightKg: currentWeight,
        weightDiffKg: targetWeight - currentWeight,
      });
      if (!goalResult.success) {
        setError(goalResult.error);
        return;
      }

      setStepIndex(2);
      saveGeneratedImages({
        currentImage: `data:image/jpeg;base64,${photos.front}`,
        goalImage: `data:image/png;base64,${goalResult.image}`,
      });
      clearScanPhotos();

      setProgress(100);
      setTimeout(() => router.push(`/result?${params.toString()}`), 400);
    })().catch((e) => {
      setError(e instanceof Error ? e.message : "画像生成に失敗しました。もう一度お試しください。");
    }).finally(() => {
      clearInterval(progressInterval);
    });

    return () => {
      clearInterval(progressInterval);
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">画像生成に失敗しました</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <Link
            href="/adjust"
            className="inline-block py-3 px-8 rounded-full bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors"
          >
            調整画面に戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="max-w-sm w-full text-center space-y-10">
        {/* Animated orbs */}
        <div className="relative w-40 h-40 mx-auto">
          <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-50" />
          <div className="absolute inset-4 rounded-full bg-violet-200 animate-pulse opacity-70" />
          <div className="absolute inset-8 rounded-full bg-violet-100 flex items-center justify-center">
            <span className="text-3xl">✨</span>
          </div>
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="72" fill="none" stroke="#ede9fe" strokeWidth="6" />
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress / 100)}`}
              className="transition-all duration-100 ease-linear"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-3 text-slate-900">AI画像を生成中</h1>
          <p className="text-slate-500 text-sm">Gemini AIが体型アバターを作成しています</p>
          <p className="text-slate-300 text-xs mt-1">完了まで10〜20秒かかります</p>
        </div>

        {/* Step list */}
        <div className="space-y-3 text-left">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? "bg-violet-600 text-white"
                    : i === stepIndex
                    ? "bg-violet-100 border border-violet-400 text-violet-600 animate-pulse"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm transition-colors duration-300 ${
                  i <= stepIndex ? "text-slate-900" : "text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-300">
          生成された画像はGemini API（Google）のポリシーに従って処理されます
        </p>
      </div>
    </main>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense>
      <GeneratingContent />
    </Suspense>
  );
}
