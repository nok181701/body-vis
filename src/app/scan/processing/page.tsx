"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { clearScanPhotos, loadScanPhotos } from "@/lib/scan-photo-storage";

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
  const processingPromiseRef = useRef<Promise<void> | null>(null);

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

    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEP_LABELS.length - 1));
    }, 800);
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 95));
    }, 100);

    let cancelled = false;

    // TODO: MediaPipe + 推定モデルによる体型解析に置き換える
    if (!processingPromiseRef.current) {
      processingPromiseRef.current = new Promise<void>((resolve) => {
        setTimeout(resolve, 4000);
      });
    }

    processingPromiseRef.current
      .then(() => {
        if (cancelled) return;
        clearScanPhotos();

        const params = new URLSearchParams({
          gender,
          height: height.toString(),
          weight: weight.toString(),
          age: age.toString(),
        });

        setStepIndex(STEP_LABELS.length - 1);
        setProgress(100);
        setTimeout(() => router.push(`/scan/result?${params.toString()}`), 400);
      })
      .catch(() => {
        if (cancelled) return;
        clearScanPhotos();
        setError("解析に失敗しました。もう一度お試しください。");
      })
      .finally(() => {
        clearInterval(stepTimer);
        clearInterval(progressTimer);
      });

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full text-center space-y-6">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold">解析に失敗しました</h1>
          <p className="text-sm text-zinc-400">{error}</p>
          <Link
            href="/scan"
            className="inline-block py-3 px-8 rounded-full bg-lime-400 text-black font-bold text-sm hover:bg-lime-300 transition-colors"
          >
            やり直す
          </Link>
        </div>
      </main>
    );
  }

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
          <p className="text-zinc-400 text-sm">完了まで数秒かかります</p>
        </div>

        {/* Step list */}
        <div className="space-y-3 text-left">
          {STEP_LABELS.map((label, i) => (
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
                {label}
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
