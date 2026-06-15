"use client";

import { Suspense, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { fileToBase64 } from "@/lib/scan-photo-storage";
import { saveGarmentPhoto } from "@/lib/garment-photo-storage";
import { BrandHero } from "@/components/brand-hero";
import { NumberField } from "@/components/number-field";
import type { GarmentType } from "@/lib/gemini/try-on-prompt";

const GARMENT_TYPES: { value: GarmentType; label: string }[] = [
  { value: "top", label: "トップス" },
  { value: "bottom", label: "ボトムス" },
  { value: "outer", label: "アウター" },
  { value: "dress", label: "ワンピース" },
];

interface SizeFields {
  length: string;
  chest: string;
  shoulder: string;
  sleeve: string;
  waist: string;
  rise: string;
  inseam: string;
}

const EMPTY_SIZES: SizeFields = {
  length: "",
  chest: "",
  shoulder: "",
  sleeve: "",
  waist: "",
  rise: "",
  inseam: "",
};

function TryOnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState<GarmentType>("top");
  const [garmentName, setGarmentName] = useState("");
  const [sizes, setSizes] = useState<SizeFields>(EMPTY_SIZES);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ garmentPhoto?: string; consent?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleGarmentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setGarmentPreview(URL.createObjectURL(file));
      setGarmentFile(file);
    },
    [],
  );

  const setSize = (key: keyof SizeFields) => (value: string) =>
    setSizes((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!garmentFile) newErrors.garmentPhoto = "服の画像を選択してください";
    if (!consent) newErrors.consent = "同意が必要です";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !garmentFile) return;

    setSubmitting(true);
    try {
      const garmentBase64 = await fileToBase64(garmentFile);
      saveGarmentPhoto(garmentBase64);

      const params = new URLSearchParams(searchParams.toString());
      params.set("garmentType", garmentType);
      if (garmentName) params.set("garmentName", garmentName);
      for (const [key, value] of Object.entries(sizes)) {
        // 身体測定値（waistなど）とのキー衝突を避けるためgarmentプレフィックスを付与
        if (value) params.set(`garment${key[0].toUpperCase()}${key.slice(1)}`, value);
      }

      router.push(`/try-on/generating?${params.toString()}`);
    } catch {
      setErrors({ garmentPhoto: "画像の読み込みに失敗しました。もう一度お試しください" });
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:flex">
      {/* Left: ブランドエリア（PCでは常時表示） */}
      <div className="px-2 py-13 lg:w-1/2 lg:px-16 lg:py-0 lg:flex lg:items-center lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-violet-50 to-white">
        <BrandHero />
      </div>

      {/* Right: 入力スペース */}
      <div className="max-w-lg mx-auto px-6 py-10 lg:w-1/2 lg:max-w-none">
        <div className="mb-8">
          <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-2">Step 3</p>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">試着する服を選ぶ</h1>
          <p className="text-slate-500 text-sm">
            服の画像と種類・寸法を入力すると、AIがあなたの写真に試着させたイメージを生成します。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Garment photo upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              服の写真
            </label>
            <button
              type="button"
              onClick={() => garmentInputRef.current?.click()}
              className={`w-full aspect-[3/4] max-w-xs mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden relative ${
                errors.garmentPhoto
                  ? "border-red-300 bg-red-50"
                  : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50"
              }`}
            >
              {garmentPreview ? (
                <Image
                  src={garmentPreview}
                  alt="服の写真"
                  fill
                  className="object-cover"
                />
              ) : (
                <>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-violet-300"
                  >
                    <path
                      d="M7 4l2 2h6l2-2 3 3-2 2v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9L3 7l3-3Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs text-slate-400">タップして選択</span>
                </>
              )}
            </button>
            <input
              ref={garmentInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGarmentChange}
            />
            {errors.garmentPhoto && (
              <p className="mt-1 text-xs text-red-500">{errors.garmentPhoto}</p>
            )}
          </div>

          {/* Garment type */}
          <div>
            <label className="block text-sm font-medium mb-3 text-slate-700">
              服の種類
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GARMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setGarmentType(t.value)}
                  className={`py-3 rounded-xl border font-medium text-sm transition-colors ${
                    garmentType === t.value
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Garment name (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              服の名称（任意）
            </label>
            <input
              type="text"
              value={garmentName}
              onChange={(e) => setGarmentName(e.target.value)}
              placeholder="例：オーバーサイズTシャツ"
              className="w-full px-3 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-100 transition-colors"
            />
          </div>

          {/* Size inputs */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-700">寸法（任意）</p>
              <p className="text-xs text-slate-400 mt-0.5">
                入力すると試着結果のフィット感判定に使用されます
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {(garmentType === "top" || garmentType === "outer") && (
                <>
                  <NumberField label="着丈" unit="cm" value={sizes.length} onChange={setSize("length")} placeholder="65" />
                  <NumberField label="身幅" unit="cm" value={sizes.chest} onChange={setSize("chest")} placeholder="55" />
                  <NumberField label="肩幅" unit="cm" value={sizes.shoulder} onChange={setSize("shoulder")} placeholder="45" />
                  <NumberField label="袖丈" unit="cm" value={sizes.sleeve} onChange={setSize("sleeve")} placeholder="60" />
                </>
              )}
              {garmentType === "bottom" && (
                <>
                  <NumberField label="ウエスト" unit="cm" value={sizes.waist} onChange={setSize("waist")} placeholder="80" />
                  <NumberField label="股上" unit="cm" value={sizes.rise} onChange={setSize("rise")} placeholder="28" />
                  <NumberField label="股下" unit="cm" value={sizes.inseam} onChange={setSize("inseam")} placeholder="75" />
                </>
              )}
              {garmentType === "dress" && (
                <>
                  <NumberField label="着丈" unit="cm" value={sizes.length} onChange={setSize("length")} placeholder="90" />
                  <NumberField label="身幅" unit="cm" value={sizes.chest} onChange={setSize("chest")} placeholder="48" />
                  <NumberField label="ウエスト" unit="cm" value={sizes.waist} onChange={setSize("waist")} placeholder="70" />
                </>
              )}
            </div>
          </div>

          {/* Consent */}
          <div
            className={`p-4 rounded-xl border ${
              errors.consent
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-violet-600"
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                アップロードした写真・服の画像はGemini
                API（Google）へ送信され、試着イメージの生成に使用されることに同意します。
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-xs text-red-500">{errors.consent}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-100"
          >
            {submitting ? "準備中..." : "試着イメージを生成する →"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function TryOnPage() {
  return (
    <Suspense>
      <TryOnContent />
    </Suspense>
  );
}
