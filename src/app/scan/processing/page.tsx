"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const STEPS = [
  { label: "写真を受信中...", duration: 1500 },
  { label: "体型を解析中...", duration: 4000 },
  { label: "体脂肪率を計算中...", duration: 3000 },
  { label: "筋肉量を算出中...", duration: 2500 },
  { label: "データを整理中...", duration: 1500 },
];

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const total = STEPS.reduce((sum, s) => sum + s.duration, 0);

    const intervals: ReturnType<typeof setInterval>[] = [];

    let cumulative = 0;
    STEPS.forEach((step, i) => {
      const delay = cumulative;
      cumulative += step.duration;
      const t = setTimeout(() => setStepIndex(i), delay);
      intervals.push(t as unknown as ReturnType<typeof setInterval>);
    });

    const progressInterval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(Math.floor((elapsed / total) * 100), 99));
      if (elapsed >= total) {
        clearInterval(progressInterval);
      }
    }, 100);

    const done = setTimeout(() => {
      const params = new URLSearchParams({
        gender: searchParams.get("gender") ?? "male",
        height: searchParams.get("height") ?? "",
        weight: searchParams.get("weight") ?? "",
        age: searchParams.get("age") ?? "",
        bodyFatPct: "18.5",
        muscleMass: "34.2",
        waist: "78.0",
        shoulderWidth: "42.5",
      });
      router.push(`/scan/result?${params.toString()}`);
    }, total + 500);

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(done);
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full text-center space-y-10">
        {/* Spinner */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#a3e635"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              className="transition-all duration-100 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-lime-400">{progress}%</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-3">体型を解析中</h1>
          <p className="text-zinc-400 text-sm">完了まで10〜30秒かかります</p>
        </div>

        {/* Step list */}
        <div className="space-y-3 text-left">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? "bg-lime-400 text-black"
                    : i === stepIndex
                    ? "bg-lime-400/20 border border-lime-400 text-lime-400 animate-pulse"
                    : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm transition-colors duration-300 ${
                  i <= stepIndex ? "text-white" : "text-zinc-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-600">
          写真はこの処理完了後に即時廃棄されます
        </p>
      </div>
    </main>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense>
      <ProcessingContent />
    </Suspense>
  );
}
