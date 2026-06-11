"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { clearScanPhotos, loadScanPhotos } from "@/lib/scan-photo-storage";
import { detectBodyRatios } from "@/lib/mediapipe/pose";
import { estimateBody } from "@/lib/mediapipe/body-estimation";
import type { EstimatedBody } from "@/lib/mediapipe/body-estimation";

const STEP_LABELS = [
  "写真を読み込み中...",
  "ポーズを検出中...",
  "体型を推定中...",
  "体脂肪率を計算中...",
  "データを整理中...",
];

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Strict Modeで2回実行されても処理が重複しないようPromiseをキャッシュする
  const processingPromiseRef = useRef<Promise<EstimatedBody> | null>(null);

  useEffect(() => {
    const photos = loadScanPhotos();
    if (!photos) {
      router.replace("/scan");
      return;
    }

    const gender = (searchParams.get("gender") ?? "male") as "male" | "female";
    const height = parseFloat(searchParams.get("height") ?? "0");
    const weight = parseFloat(searchParams.get("weight") ?? "0");
    const age = parseInt(searchParams.get("age") ?? "0");
    const neckRaw = searchParams.get("neck");
    const abdomenRaw = searchParams.get("abdomen");
    const hipRaw = searchParams.get("hip");
    const neck = neckRaw ? parseFloat(neckRaw) : undefined;
    const abdomen = abdomenRaw ? parseFloat(abdomenRaw) : undefined;
    const hip = hipRaw ? parseFloat(hipRaw) : undefined;

    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 90));
    }, 150);

    let cancelled = false;

    if (!processingPromiseRef.current) {
      processingPromiseRef.current = (async (): Promise<EstimatedBody> => {
        setStepIndex(0);
        const ratios = await detectBodyRatios(photos.front);
        setStepIndex(2);
        const estimated = estimateBody({ gender, height, weight, age, neck, abdomen, hip }, ratios);
        setStepIndex(4);
        return estimated;
      })();
    }

    processingPromiseRef.current
      .then((estimated) => {
        if (cancelled) return;

        const params = new URLSearchParams({
          gender,
          height: height.toString(),
          weight: weight.toString(),
          age: age.toString(),
          bodyFatPct: estimated.bodyFatPct.toString(),
          muscleMass: estimated.muscleMass.toString(),
          shoulderWidth: estimated.shoulderWidth.toString(),
          waist: estimated.waist.toString(),
        });

        setStepIndex(STEP_LABELS.length - 1);
        setProgress(100);
        setTimeout(() => router.push(`/scan/result?${params.toString()}`), 400);
      })
      .catch((e) => {
        if (cancelled) return;
        clearScanPhotos();
        setError(e instanceof Error ? e.message : "解析に失敗しました。もう一度お試しください。");
      })
      .finally(() => {
        clearInterval(progressTimer);
      });

    return () => {
      cancelled = true;
      clearInterval(progressTimer);
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">解析に失敗しました</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <Link
            href="/scan"
            className="inline-block py-3 px-8 rounded-full bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors"
          >
            やり直す
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="max-w-sm w-full text-center space-y-10">
        {/* Spinner */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#ede9fe" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              className="transition-all duration-100 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-violet-600">{progress}%</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-3 text-slate-900">体型を解析中</h1>
          <p className="text-slate-400 text-sm">完了まで数秒かかります</p>
        </div>

        {/* Step list */}
        <div className="space-y-3 text-left">
          {STEP_LABELS.map((label, i) => (
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
                {label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-300">
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
