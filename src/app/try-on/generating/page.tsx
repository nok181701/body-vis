"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { loadScanPhotos } from "@/lib/scan-photo-storage";
import { clearGarmentPhoto, loadGarmentPhoto } from "@/lib/garment-photo-storage";
import { saveTryOnResult } from "@/lib/try-on-result-storage";
import { generateTryOn } from "@/lib/gemini/generate-try-on";
import { buildTryOnPrompt, type BodyMeasurements, type GarmentSpec, type GarmentType, type Gender } from "@/lib/gemini/try-on-prompt";
import { BrandHero } from "@/components/brand-hero";

const STEPS = [
  { label: "写真を準備中..." },
  { label: "試着イメージを生成中..." },
  { label: "画像を最終調整中..." },
];

function parseOptionalNumber(searchParams: URLSearchParams, key: string): number | undefined {
  const raw = searchParams.get(key);
  if (raw === null || raw === "") return undefined;
  const value = parseFloat(raw);
  return isNaN(value) ? undefined : value;
}

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
    const garmentPhoto = loadGarmentPhoto();
    if (!photos || !garmentPhoto) {
      router.replace("/");
      return;
    }

    const body: BodyMeasurements = {
      gender: (searchParams.get("gender") ?? "male") as Gender,
      heightCm: parseFloat(searchParams.get("height") ?? "170"),
      weightKg: parseFloat(searchParams.get("weight") ?? "70"),
      shoulderWidthCm: parseOptionalNumber(searchParams, "shoulderWidth"),
      bustGirthCm: parseOptionalNumber(searchParams, "bustGirth"),
      waistCm: parseOptionalNumber(searchParams, "waist"),
      hipGirthCm: parseOptionalNumber(searchParams, "hipGirth"),
      insideLegHeightCm: parseOptionalNumber(searchParams, "insideLegHeight"),
      sleeveLengthCm: parseOptionalNumber(searchParams, "sleeveLength"),
      neckGirthCm: parseOptionalNumber(searchParams, "neckGirth"),
    };

    const garment: GarmentSpec = {
      type: (searchParams.get("garmentType") ?? "top") as GarmentType,
      name: searchParams.get("garmentName") ?? undefined,
      lengthCm: parseOptionalNumber(searchParams, "garmentLength"),
      chestCm: parseOptionalNumber(searchParams, "garmentChest"),
      shoulderCm: parseOptionalNumber(searchParams, "garmentShoulder"),
      sleeveCm: parseOptionalNumber(searchParams, "garmentSleeve"),
      waistCm: parseOptionalNumber(searchParams, "garmentWaist"),
      riseCm: parseOptionalNumber(searchParams, "garmentRise"),
      inseamCm: parseOptionalNumber(searchParams, "garmentInseam"),
    };

    const resultParams = new URLSearchParams(searchParams.toString());

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 95));
    }, 150);

    (async () => {
      setStepIndex(0);

      setStepIndex(1);
      const prompt = buildTryOnPrompt(body, garment);
      const result = await generateTryOn({
        personPhoto: photos.front,
        garmentPhoto,
        prompt,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }

      setStepIndex(2);
      saveTryOnResult({
        personImage: `data:image/jpeg;base64,${photos.front}`,
        tryOnImage: `data:image/png;base64,${result.image}`,
      });
      clearGarmentPhoto();

      setProgress(100);
      setTimeout(() => router.push(`/result?${resultParams.toString()}`), 400);
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
      <main className="min-h-screen bg-white lg:flex">
        {/* Left: ブランドエリア（PCでは常時表示） */}
        <div className="px-2 py-13 lg:w-1/2 lg:px-16 lg:py-0 lg:flex lg:items-center lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-violet-50 to-white">
          <BrandHero />
        </div>

        {/* Right: コンテンツ */}
        <div className="flex flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:min-h-screen">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">画像生成に失敗しました</h1>
            <p className="text-sm text-slate-500">{error}</p>
            <Link
              href="/try-on"
              className="inline-block py-3 px-8 rounded-full bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors"
            >
              試着画面に戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white lg:flex">
      {/* Left: ブランドエリア（PCでは常時表示） */}
      <div className="px-2 py-13 lg:w-1/2 lg:px-16 lg:py-0 lg:flex lg:items-center lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-violet-50 to-white">
        <BrandHero />
      </div>

      {/* Right: 生成中コンテンツ */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:min-h-screen">
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
          <p className="text-slate-500 text-sm">Gemini AIが試着イメージを作成しています</p>
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
