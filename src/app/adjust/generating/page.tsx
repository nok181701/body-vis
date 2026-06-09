"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const STEPS = [
  { label: "体組成データを送信中...", duration: 1500 },
  { label: "現在の体型アバターを生成中...", duration: 5000 },
  { label: "目標体型アバターを生成中...", duration: 5000 },
  { label: "画像を最終調整中...", duration: 2000 },
];

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const total = STEPS.reduce((sum, s) => sum + s.duration, 0);

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    STEPS.forEach((_, i) => {
      const delay = cumulative;
      cumulative += STEPS[i].duration;
      timeouts.push(setTimeout(() => setStepIndex(i), delay));
    });

    const progressInterval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(Math.floor((elapsed / total) * 100), 99));
      if (elapsed >= total) clearInterval(progressInterval);
    }, 100);

    const done = setTimeout(() => {
      const params = new URLSearchParams({
        gender: searchParams.get("gender") ?? "male",
        height: searchParams.get("height") ?? "170",
        currentWeight: searchParams.get("currentWeight") ?? "70",
        currentFat: searchParams.get("currentFat") ?? "20",
        currentMuscle: searchParams.get("currentMuscle") ?? "30",
        targetWeight: searchParams.get("targetWeight") ?? "65",
        targetFat: searchParams.get("targetFat") ?? "15",
      });
      router.push(`/result?${params.toString()}`);
    }, total + 500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(done);
    };
  }, [router, searchParams]);

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
