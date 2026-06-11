/**
 * Gemini API（gemini-3-pro-image-preview）向けの
 * 体型アバター生成プロンプトとSafety設定を定義する。
 */

import { HarmCategory, HarmBlockThreshold, type SafetySetting } from "@google/genai";

export type Gender = "male" | "female";

interface FatCategory {
  label: string;
  description: string;
}

// 体脂肪率カテゴリ（男性）
const MALE_CATEGORIES: { max: number; category: FatCategory }[] = [
  { max: 9, category: { label: "shredded", description: "extreme muscle definition, visible veins" } },
  { max: 14, category: { label: "lean athletic", description: "visible abdominal definition, broad shoulders" } },
  { max: 19, category: { label: "fit", description: "toned muscles, slim waist" } },
  { max: 24, category: { label: "average", description: "soft muscle definition, natural build" } },
  { max: Infinity, category: { label: "overfat", description: "rounded abdomen, softer physique" } },
];

// 体脂肪率カテゴリ（女性）
const FEMALE_CATEGORIES: { max: number; category: FatCategory }[] = [
  { max: 17, category: { label: "athletic lean", description: "visible muscle tone, defined waistline" } },
  { max: 21, category: { label: "fit", description: "toned muscles, slim figure" } },
  { max: 27, category: { label: "average", description: "soft natural curves, balanced build" } },
  { max: 34, category: { label: "softer", description: "fuller curves, softer physique" } },
  { max: Infinity, category: { label: "overfat", description: "rounded midsection, very soft physique" } },
];

export function getFatCategory(gender: Gender, fatPct: number): FatCategory {
  const table = gender === "male" ? MALE_CATEGORIES : FEMALE_CATEGORIES;
  const found = table.find((entry) => fatPct <= entry.max);
  return found?.category ?? table[table.length - 1].category;
}

export function buildPrompt(
  gender: Gender,
  fatPct: number,
  heightCm: number,
  currentWeightKg: number,
  weightDiffKg: number,
): string {
  const category = getFatCategory(gender, fatPct);
  const roundedDiff = Math.round(Math.abs(weightDiffKg) * 10) / 10;
  const pct = currentWeightKg > 0 ? Math.round((Math.abs(weightDiffKg) / currentWeightKg) * 100) : 0;

  const changeDescription =
    roundedDiff === 0
      ? "This is the person's current body, kept as-is."
      : weightDiffKg < 0
        ? `This person has lost about ${roundedDiff}kg, roughly ${pct}% of their body weight. Render a clear, dramatic before/after weight-loss transformation.`
        : `This person has gained about ${roundedDiff}kg, roughly ${pct}% of their body weight. Render a clear, dramatic before/after weight-gain transformation.`;

  const faceInstruction =
    weightDiffKg < 0
      ? "The face must look noticeably slimmer than the original: visibly reduced cheek and jaw fat, a more defined jawline, and a slimmer neck/chin area with no double chin."
      : weightDiffKg > 0
        ? "The face must look noticeably fuller than the original: rounder cheeks and a softer jawline."
        : "Keep the face exactly as in the original photo.";

  const bodyInstruction =
    weightDiffKg < 0
      ? "The belly and waist must look noticeably slimmer than the original: a flatter stomach, less visceral/love-handle fat around the abdomen and sides, and a more defined waistline."
      : weightDiffKg > 0
        ? "The belly and waist must look noticeably larger than the original: a rounder stomach and more fat around the abdomen and sides."
        : "Keep the belly and waist exactly as in the original photo.";

  const chestAndLegsInstruction =
    weightDiffKg < 0
      ? "The chest must look noticeably leaner than the original, with less fat and more visible muscle/collarbone definition. The legs (thighs, calves, and hips) must also look noticeably slimmer, with less fat."
      : weightDiffKg > 0
        ? "The chest must look noticeably fuller than the original, with more fat. The legs (thighs, calves, and hips) must also look noticeably larger, with more fat."
        : "Keep the chest and legs exactly as in the original photo.";

  return `Edit this photo to realistically transform the body composition of the ${gender} person to a ${category.label} physique (${category.description}), based on a height of ${heightCm}cm. ${changeDescription} ${faceInstruction} ${bodyInstruction} ${chestAndLegsInstruction} Also clearly change the rest of the body silhouette - shoulders and arms should also visibly reflect this change. This should look like a real, dramatic before/after transformation photo, not a subtle retouch. Keep the same person, identity, pose, clothing, background, and lighting unchanged. The result must remain a photorealistic photo of this exact person, only the body shape and facial fullness should change.`;
}

// 生成画像に含めたくない要素（必須）
export const NEGATIVE_PROMPT =
  "different person, different face, changed identity, cartoon, illustration, 3d render, cg avatar, anime, drawing, painting, underweight, extremely thin, anorexic, unhealthy, bones visible, nsfw, explicit";

export const SAFETY_SETTINGS: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";
