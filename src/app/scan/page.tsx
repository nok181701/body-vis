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
  frontPhoto: File | null;
  sidePhoto: File | null;
}

interface PhotoPreview {
  front: string | null;
  side: string | null;
}

export default function ScanPage() {
  const router = useRouter();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    gender: "",
    height: "",
    weight: "",
    age: "",
    frontPhoto: null,
    sidePhoto: null,
  });

  const [previews, setPreviews] = useState<PhotoPreview>({ front: null, side: null });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "consent", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = useCallback(
    (type: "front" | "side") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [type]: url }));
      setForm((prev) => ({
        ...prev,
        [type === "front" ? "frontPhoto" : "sidePhoto"]: file,
      }));
    },
    []
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
    if (!form.sidePhoto) newErrors.sidePhoto = "側面写真を選択してください";
    if (!consent) newErrors.consent = "同意が必要です";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    if (!form.frontPhoto || !form.sidePhoto) return;

    setSubmitting(true);
    try {
      const [front, side] = await Promise.all([
        fileToBase64(form.frontPhoto),
        fileToBase64(form.sidePhoto),
      ]);
      saveScanPhotos({ front, side });

      const params = new URLSearchParams({
        gender: form.gender,
        height: form.height,
        weight: form.weight,
        age: form.age,
      });
      router.push(`/scan/processing?${params.toString()}`);
    } catch {
      setErrors((prev) => ({ ...prev, frontPhoto: "写真の読み込みに失敗しました。もう一度お試しください" }));
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs text-lime-400 font-semibold uppercase tracking-widest mb-2">Step 1</p>
          <h1 className="text-3xl font-bold mb-2">体型をスキャン</h1>
          <p className="text-zinc-400 text-sm">
            写真と基本情報を入力してください。写真はAPIへの送信後、即時廃棄されます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Photo upload */}
          <div className="grid grid-cols-2 gap-4">
            <PhotoDropzone
              label="正面写真"
              preview={previews.front}
              inputRef={frontInputRef}
              onChange={handlePhotoChange("front")}
              error={errors.frontPhoto}
            />
            <PhotoDropzone
              label="側面写真（右）"
              preview={previews.side}
              inputRef={sideInputRef}
              onChange={handlePhotoChange("side")}
              error={errors.sidePhoto}
            />
          </div>

          {/* Tips */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 space-y-1">
            <p className="font-medium text-white mb-2">📌 撮影のコツ</p>
            <p>• 全身が映るよう1.5〜2m離れて撮影</p>
            <p>• タイトな服装（または水着）推奨</p>
            <p>• 背景はシンプルな壁</p>
            <p>• 正面は正面向き、側面は右向きで</p>
            <p>• 腕は体から少し離し、自然に下ろした状態で撮影</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-3">性別</label>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
                  className={`py-3 rounded-xl border font-medium text-sm transition-colors ${
                    form.gender === g
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {g === "male" ? "男性" : "女性"}
                </button>
              ))}
            </div>
            {errors.gender && <p className="mt-1 text-xs text-red-400">{errors.gender}</p>}
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

          {/* Consent */}
          <div
            className={`p-4 rounded-xl border ${
              errors.consent ? "border-red-500/50 bg-red-500/5" : "border-zinc-800 bg-zinc-900"
            }`}
          >
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-lime-400"
              />
              <span className="text-sm text-zinc-300 leading-relaxed">
                写真はBodygram社のAPIへ送信され、解析後に廃棄されることを理解しました。
                体組成データはGemini API（Google）へ送信されることに同意します。
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-xs text-red-400">{errors.consent}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-full bg-lime-400 text-black font-bold text-base hover:bg-lime-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "写真を準備中..." : "スキャンを開始する"}
          </button>
        </form>
      </div>
    </main>
  );
}

function PhotoDropzone({
  label,
  preview,
  inputRef,
  onChange,
  error,
}: {
  label: string;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden relative ${
          error
            ? "border-red-500/50 bg-red-500/5"
            : "border-zinc-700 bg-zinc-900 hover:border-lime-400/50 hover:bg-zinc-800"
        }`}
      >
        {preview ? (
          <Image src={preview} alt={label} fill className="object-cover" />
        ) : (
          <>
            <span className="text-3xl">📷</span>
            <span className="text-xs text-zinc-400">タップして選択</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
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
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-3 pr-10 rounded-xl bg-zinc-900 border text-sm outline-none focus:border-lime-400 transition-colors ${
            error ? "border-red-500/50" : "border-zinc-800"
          }`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{unit}</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
