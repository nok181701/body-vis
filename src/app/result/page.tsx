"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clearTryOnResult, loadTryOnResult } from "@/lib/try-on-result-storage";
import { BrandHero } from "@/components/brand-hero";
import type { GarmentType } from "@/lib/gemini/try-on-prompt";

const GARMENT_TYPE_LABELS: Record<GarmentType, string> = {
  top: "トップス",
  bottom: "ボトムス",
  outer: "アウター",
  dress: "ワンピース",
};

const GARMENT_SIZE_LABELS: { key: string; label: string }[] = [
  { key: "garmentLength", label: "着丈" },
  { key: "garmentChest", label: "身幅" },
  { key: "garmentShoulder", label: "肩幅" },
  { key: "garmentSleeve", label: "袖丈" },
  { key: "garmentWaist", label: "ウエスト" },
  { key: "garmentRise", label: "股上" },
  { key: "garmentInseam", label: "股下" },
];

type FitLevel = "loose" | "just" | "tight" | "unknown";

const FIT_LABELS: Record<FitLevel, { label: string; color: string }> = {
  loose: { label: "ゆったり", color: "text-sky-600" },
  just: { label: "ジャストフィット", color: "text-emerald-600" },
  tight: { label: "タイト", color: "text-orange-600" },
  unknown: { label: "比較データなし", color: "text-slate-400" },
};

function judgeFit(garmentCm?: number, bodyCm?: number): FitLevel {
  if (garmentCm === undefined || bodyCm === undefined) return "unknown";
  const diff = garmentCm - bodyCm;
  if (diff > 2) return "loose";
  if (diff < -2) return "tight";
  return "just";
}

function ResultContent() {
  const searchParams = useSearchParams();
  const [images] = useState<{ personImage: string; tryOnImage: string } | null>(() =>
    typeof window === "undefined" ? null : loadTryOnResult()
  );

  useEffect(() => {
    return () => clearTryOnResult();
  }, []);

  const parseOptional = (key: string): number | undefined => {
    const raw = searchParams.get(key);
    if (raw === null || raw === "") return undefined;
    const value = parseFloat(raw);
    return isNaN(value) ? undefined : value;
  };

  const gender = searchParams.get("gender") ?? "male";
  const garmentType = (searchParams.get("garmentType") ?? "top") as GarmentType;
  const garmentName = searchParams.get("garmentName");
  const waist = parseOptional("waist");
  const shoulderWidth = parseOptional("shoulderWidth");
  const garmentWaist = parseOptional("garmentWaist");
  const garmentShoulder = parseOptional("garmentShoulder");

  const shoulderFit = judgeFit(garmentShoulder, shoulderWidth);
  const waistFit = judgeFit(garmentWaist, waist);

  const showShoulderFit = garmentType === "top" || garmentType === "outer" || garmentType === "dress";
  const showWaistFit = garmentType === "bottom" || garmentType === "dress";

  const garmentSizeEntries = GARMENT_SIZE_LABELS
    .map(({ key, label }) => ({ label, value: parseOptional(key) }))
    .filter((entry) => entry.value !== undefined);

  // 「別の服で試着する」用：身体測定値を/try-onが期待するパラメータ名で引き渡す
  const tryOnParams = new URLSearchParams({
    gender,
    height: searchParams.get("height") ?? "170",
    weight: searchParams.get("weight") ?? "70",
    age: searchParams.get("age") ?? "25",
  });
  const bodyFatPct = searchParams.get("bodyFatPct");
  const muscleMass = searchParams.get("muscleMass");
  if (bodyFatPct) tryOnParams.set("bodyFatPct", bodyFatPct);
  if (muscleMass) tryOnParams.set("muscleMass", muscleMass);
  if (waist !== undefined) tryOnParams.set("waist", waist.toString());
  if (shoulderWidth !== undefined) tryOnParams.set("shoulderWidth", shoulderWidth.toString());

  return (
    <main className="min-h-screen bg-white lg:flex">
      {/* Left: ブランドエリア（PCでは常時表示） */}
      <div className="px-2 py-13 lg:w-1/2 lg:px-16 lg:py-0 lg:flex lg:items-center lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-violet-50 to-white">
        <BrandHero />
      </div>

      {/* Right: 結果表示 */}
      <div className="px-6 py-12 lg:w-1/2 lg:max-w-none">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-2">Result</p>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">バーチャル試着完了</h1>
          <p className="text-slate-500 text-sm">
            AIが生成した試着イメージです。参考値として活用してください。
          </p>
        </div>

        {/* Before / After images */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <PhotoCard label="本人" image={images?.personImage} />
          <PhotoCard label="試着後" image={images?.tryOnImage} isTarget />
        </div>

        {/* Garment info */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-8">
          <h2 className="font-bold mb-4 text-slate-900">服の情報</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              {GARMENT_TYPE_LABELS[garmentType]}
            </span>
            {garmentName && <span className="text-sm text-slate-700">{garmentName}</span>}
          </div>
          {garmentSizeEntries.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {garmentSizeEntries.map((entry) => (
                <div key={entry.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-xs text-slate-400 mb-1">{entry.label}</p>
                  <p className="text-sm font-bold text-slate-900">{entry.value} cm</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">寸法は入力されていません</p>
          )}
        </div>

        {/* Fit judgement */}
        {(showShoulderFit || showWaistFit) && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-8">
            <h2 className="font-bold mb-4 text-slate-900">フィット感の目安</h2>
            <div className="grid grid-cols-2 gap-4">
              {showShoulderFit && (
                <FitCard label="肩幅" fit={shoulderFit} />
              )}
              {showWaistFit && (
                <FitCard label="ウエスト" fit={waistFit} />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              ※ 服の寸法とスキャンによる身体推定値（MediaPipe）の差分から算出した参考値です。
            </p>
          </div>
        )}

        <p className="text-xs text-slate-300 text-center mb-8">
          ※ 表示されている試着イメージはAIによる参考イメージです。実際の着用感とは異なる場合があります。
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/try-on?${tryOnParams.toString()}`}
            className="py-4 rounded-full border border-slate-200 text-slate-700 font-medium text-sm text-center hover:bg-slate-50 transition-colors"
          >
            別の服で試着する
          </Link>
          <Link
            href="/"
            className="py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm text-center hover:opacity-90 transition-opacity"
          >
            もう一度スキャン
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}

function PhotoCard({ label, image, isTarget }: { label: string; image?: string; isTarget?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${isTarget ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isTarget ? "text-violet-600" : "text-slate-400"}`}>
        {label}
      </p>
      <div className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden ${isTarget ? "bg-violet-100" : "bg-slate-200"}`}>
        {image && <Image src={image} alt={label} fill className="object-cover" unoptimized />}
      </div>
    </div>
  );
}

function FitCard({ label, fit }: { label: string; fit: FitLevel }) {
  const { label: fitLabel, color } = FIT_LABELS[fit];
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{fitLabel}</p>
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
