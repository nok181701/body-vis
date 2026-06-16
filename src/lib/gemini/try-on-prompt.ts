/**
 * Gemini API（gemini-3-pro-image-preview）向けの
 * バーチャル試着画像生成プロンプトとSafety設定を定義する。
 */

import { HarmCategory, HarmBlockThreshold, type SafetySetting } from "@google/genai";

export type Gender = "male" | "female";
export type GarmentType = "top" | "bottom" | "outer" | "dress";

export interface BodyMeasurements {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  shoulderWidthCm?: number;
  bustGirthCm?: number;
  waistCm?: number;
  hipGirthCm?: number;
  insideLegHeightCm?: number;
  sleeveLengthCm?: number;
  neckGirthCm?: number;
}

export interface GarmentSpec {
  type: GarmentType;
  name?: string;
  /** 着丈（トップス・アウター・ワンピース） */
  lengthCm?: number;
  /** 身幅（トップス・アウター・ワンピース） */
  chestCm?: number;
  /** 肩幅（トップス・アウター） */
  shoulderCm?: number;
  /** 袖丈（トップス・アウター） */
  sleeveCm?: number;
  /** ウエスト（ボトムス・ワンピース） */
  waistCm?: number;
  /** 股上（ボトムス） */
  riseCm?: number;
  /** 股下（ボトムス） */
  inseamCm?: number;
}

const GARMENT_TYPE_LABELS: Record<GarmentType, string> = {
  top: "top (shirt/T-shirt)",
  bottom: "bottom (pants/skirt)",
  outer: "outer (jacket/coat)",
  dress: "one-piece dress",
};

// 服タイプ別の着せ替え指示
const GARMENT_TYPE_INSTRUCTIONS: Record<GarmentType, string> = {
  top: "Replace the person's upper-body clothing with the provided garment. Keep the person's existing lower-body clothing (pants/skirt) unchanged.",
  bottom: "Replace the person's lower-body clothing with the provided garment. Keep the person's existing upper-body clothing unchanged.",
  outer: "Layer the provided garment over the person's existing clothing as an outer layer, as if worn on top.",
  dress: "Replace both the person's upper-body and lower-body clothing with the provided one-piece garment.",
};

function buildBodyMeasurementsSection(body: BodyMeasurements): string {
  const lines = [
    `Gender: ${body.gender}`,
    `Height: ${body.heightCm}cm`,
    `Weight: ${body.weightKg}kg`,
  ];
  if (body.shoulderWidthCm !== undefined) lines.push(`Shoulder width: ${body.shoulderWidthCm}cm`);
  if (body.bustGirthCm !== undefined)     lines.push(`Bust/chest girth: ${body.bustGirthCm}cm`);
  if (body.waistCm !== undefined)         lines.push(`Waist girth: ${body.waistCm}cm`);
  if (body.hipGirthCm !== undefined)      lines.push(`Hip girth: ${body.hipGirthCm}cm`);
  if (body.insideLegHeightCm !== undefined) lines.push(`Inseam: ${body.insideLegHeightCm}cm`);
  if (body.sleeveLengthCm !== undefined)  lines.push(`Sleeve length (back neck to wrist): ${body.sleeveLengthCm}cm`);
  if (body.neckGirthCm !== undefined)     lines.push(`Neck girth: ${body.neckGirthCm}cm`);
  return `Body measurements:\n${lines.join("\n")}`;
}

function buildGarmentSpecSection(garment: GarmentSpec): string {
  const lines = [`Type: ${GARMENT_TYPE_LABELS[garment.type]}`];
  if (garment.name) lines.push(`Name: ${garment.name}`);
  if (garment.lengthCm !== undefined) lines.push(`Length: ${garment.lengthCm}cm`);
  if (garment.chestCm !== undefined) lines.push(`Chest width: ${garment.chestCm}cm`);
  if (garment.shoulderCm !== undefined) lines.push(`Shoulder width: ${garment.shoulderCm}cm`);
  if (garment.sleeveCm !== undefined) lines.push(`Sleeve length: ${garment.sleeveCm}cm`);
  if (garment.waistCm !== undefined) lines.push(`Waist: ${garment.waistCm}cm`);
  if (garment.riseCm !== undefined) lines.push(`Rise: ${garment.riseCm}cm`);
  if (garment.inseamCm !== undefined) lines.push(`Inseam: ${garment.inseamCm}cm`);
  return `Garment specifications:\n${lines.join("\n")}`;
}

const CONSTRAINTS = [
  "Keep the person's face, identity, hairstyle, pose, background, and lighting completely unchanged.",
  "Do not resize or reshape the person's body. Render the garment's actual fit on this body based on the measurements provided (loose, tight, or just-right as appropriate) instead of altering the body to match the garment.",
  "The result must be a photorealistic photo of this exact person wearing the provided garment.",
].join(" ");

// 1枚目: 本人写真, 2枚目: 服画像 を渡す前提のプロンプトを生成する
export function buildTryOnPrompt(body: BodyMeasurements, garment: GarmentSpec): string {
  return [
    "The first image is a photo of a person. The second image is a garment.",
    buildBodyMeasurementsSection(body),
    buildGarmentSpecSection(garment),
    GARMENT_TYPE_INSTRUCTIONS[garment.type],
    CONSTRAINTS,
  ].join("\n\n");
}

// 生成画像に含めたくない要素（必須）
export const NEGATIVE_PROMPT =
  "different person, different face, changed identity, body reshaping, unrealistic fit, cartoon, illustration, 3d render, anime, drawing, painting, nsfw, explicit";

export const SAFETY_SETTINGS: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";
