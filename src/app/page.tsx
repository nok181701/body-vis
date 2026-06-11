"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fileToBase64, saveScanPhotos } from "@/lib/scan-photo-storage";

type Gender = "male" | "female";

interface FormData {
  gender: Gender | "";
  height: string;
  weight: string;
  age: string;
  neck: string;
  abdomen: string;
  hip: string;
  frontPhoto: File | null;
}

export default function Home() {
  const router = useRouter();
  const frontInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    gender: "",
    height: "",
    weight: "",
    age: "",
    neck: "",
    abdomen: "",
    hip: "",
    frontPhoto: null,
  });

  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormData | "consent", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFrontPreview(URL.createObjectURL(file));
      setForm((prev) => ({ ...prev, frontPhoto: file }));
    },
    [],
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.gender) newErrors.gender = "性別を選択してください";
    const h = parseFloat(form.height);
    if (!form.height || isNaN(h) || h < 100 || h > 250)
      newErrors.height = "身長を正しく入力してください（100〜250cm）";
    const w = parseFloat(form.weight);
    if (!form.weight || isNaN(w) || w < 20 || w > 300)
      newErrors.weight = "体重を正しく入力してください（20〜300kg）";
    const a = parseInt(form.age);
    if (!form.age || isNaN(a) || a < 10 || a > 100)
      newErrors.age = "年齢を正しく入力してください（10〜100歳）";
    if (!form.frontPhoto) newErrors.frontPhoto = "正面写真を選択してください";
    if (!consent) newErrors.consent = "同意が必要です";

    // 任意項目のバリデーション（入力した場合のみ）
    if (form.neck) {
      const n = parseFloat(form.neck);
      if (isNaN(n) || n < 20 || n > 60)
        newErrors.neck = "20〜60cmで入力してください";
    }
    if (form.abdomen) {
      const ab = parseFloat(form.abdomen);
      if (isNaN(ab) || ab < 40 || ab > 200)
        newErrors.abdomen = "40〜200cmで入力してください";
    }
    if (form.hip && form.gender === "female") {
      const hp = parseFloat(form.hip);
      if (isNaN(hp) || hp < 50 || hp > 200)
        newErrors.hip = "50〜200cmで入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    if (!form.frontPhoto) return;

    setSubmitting(true);
    try {
      const front = await fileToBase64(form.frontPhoto);
      saveScanPhotos({ front });

      const params = new URLSearchParams({
        gender: form.gender,
        height: form.height,
        weight: form.weight,
        age: form.age,
      });
      if (form.neck) params.set("neck", form.neck);
      if (form.abdomen) params.set("abdomen", form.abdomen);
      if (form.hip && form.gender === "female") params.set("hip", form.hip);

      router.push(`/scan/processing?${params.toString()}`);
    } catch {
      setErrors((prev) => ({
        ...prev,
        frontPhoto: "写真の読み込みに失敗しました。もう一度お試しください",
      }));
      setSubmitting(false);
    }
  };

  const hasCircumference =
    form.neck || form.abdomen || (form.gender === "female" && form.hip);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="px-2 py-13 text-center bg-gradient-to-b from-violet-50 to-white">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          AIで体型変化をビジュアル化
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          BodyVis
        </h1>
        <p className="max-w-xl mx-auto text-slate-500 text-sm leading-relaxed">
          写真と基本情報を入力するだけで体型データを自動推定。
          <br />
          AIが理想の姿をビジュアル化。
        </p>
      </section>

      <div className="max-w-lg mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">
              正面写真
            </label>
            <button
              type="button"
              onClick={() => frontInputRef.current?.click()}
              className={`w-full aspect-[3/4] max-w-xs mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden relative ${
                errors.frontPhoto
                  ? "border-red-300 bg-red-50"
                  : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50"
              }`}
            >
              {frontPreview ? (
                <Image
                  src={frontPreview}
                  alt="正面写真"
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
                      d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="13"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="text-xs text-slate-400">タップして選択</span>
                </>
              )}
            </button>
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
            {errors.frontPhoto && (
              <p className="mt-1 text-xs text-red-500">{errors.frontPhoto}</p>
            )}
          </div>

          {/* Tips */}
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 text-sm text-slate-600 space-y-1">
            <p className="font-medium text-violet-700 mb-2">撮影のコツ</p>
            <p>• 全身が映るよう1.5〜2m離れて撮影</p>
            <p>• 背景はシンプルな壁</p>
            <p>• 正面を向いて真っ直ぐ立つ</p>
            <p>• 腕は体から少し離し、自然に下ろした状態で撮影</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-3 text-slate-700">
              性別
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
                  className={`py-3 rounded-xl border font-medium text-sm transition-colors ${
                    form.gender === g
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {g === "male" ? "男性" : "女性"}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
            )}
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-3 gap-4">
            <NumberField
              label="身長"
              unit="cm"
              value={form.height}
              onChange={(v) => setForm((p) => ({ ...p, height: v }))}
              placeholder="170"
              error={errors.height}
            />
            <NumberField
              label="体重"
              unit="kg"
              value={form.weight}
              onChange={(v) => setForm((p) => ({ ...p, weight: v }))}
              placeholder="70"
              error={errors.weight}
            />
            <NumberField
              label="年齢"
              unit="歳"
              value={form.age}
              onChange={(v) => setForm((p) => ({ ...p, age: v }))}
              placeholder="25"
              error={errors.age}
            />
          </div>

          {/* Circumference measurements (optional, Navy method) */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  周囲計測（任意）
                </p>
                {hasCircumference && (
                  <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                    Navy式で計算
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                入力すると米海軍式（Navy式）でより正確に体脂肪率を推定します
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div
                className={`grid gap-4 ${form.gender === "female" ? "grid-cols-3" : "grid-cols-2"}`}
              >
                <NumberField
                  label="首回り"
                  unit="cm"
                  value={form.neck}
                  onChange={(v) => setForm((p) => ({ ...p, neck: v }))}
                  placeholder="38"
                  error={errors.neck}
                />
                <NumberField
                  label="腹囲"
                  unit="cm"
                  value={form.abdomen}
                  onChange={(v) => setForm((p) => ({ ...p, abdomen: v }))}
                  placeholder="80"
                  error={errors.abdomen}
                />
                {form.gender === "female" && (
                  <NumberField
                    label="ヒップ"
                    unit="cm"
                    value={form.hip}
                    onChange={(v) => setForm((p) => ({ ...p, hip: v }))}
                    placeholder="90"
                    error={errors.hip}
                  />
                )}
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                <p>• 首回り：喉仏の少し下で水平に</p>
                <p>• 腹囲：へその高さで水平に</p>
                {form.gender === "female" && (
                  <p>• ヒップ：最も太い部分で水平に</p>
                )}
              </div>
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
                写真はブラウザ上でMediaPipeにより解析されます。
                体組成データおよび写真はGemini
                API（Google）へ送信されることに同意します。
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
            {submitting ? "写真を準備中..." : "スキャンを開始する"}
          </button>
        </form>
      </div>
    </main>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-3 pr-10 rounded-xl bg-white border text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-100 transition-colors ${
            error ? "border-red-300" : "border-slate-200"
          }`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {unit}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
