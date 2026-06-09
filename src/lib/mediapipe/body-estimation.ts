import type { BodyRatios } from "./pose";

export interface UserInput {
  gender: "male" | "female";
  height: number; // cm
  weight: number; // kg
  age: number;
}

export interface EstimatedBody {
  bodyFatPct: number;    // %
  muscleMass: number;    // kg
  shoulderWidth: number; // cm
  waist: number;         // cm
}

export function estimateBody(user: UserInput, ratios: BodyRatios | null): EstimatedBody {
  const { gender, height, weight, age } = user;
  const bmi = weight / (height / 100) ** 2;

  // Deurenberg式: BMI・年齢・性別から体脂肪率を推定
  const rawFat =
    gender === "male"
      ? 1.2 * bmi + 0.23 * age - 10.8 - 5.4
      : 1.2 * bmi + 0.23 * age - 5.4;
  const fatMin = gender === "male" ? 5 : 12;
  const fatMax = gender === "male" ? 50 : 55;
  const bodyFatPct = Math.round(Math.max(fatMin, Math.min(fatMax, rawFat)) * 10) / 10;

  // 骨格筋量 = 除脂肪体重 × 0.55（骨格筋は除脂肪体重の約55%）
  const leanMass = weight * (1 - bodyFatPct / 100);
  const muscleMass = Math.round(leanMass * 0.55 * 10) / 10;

  // 肩幅: MediaPipeの比率がある場合は実寸換算、ない場合は身長の24%で代替
  // shoulderWidthRatio は「肩幅px / 肩〜足首px」の比率（アスペクト比補正済み）
  // 肩〜足首は全身の約82%に相当するため height × 0.82 で実寸換算する
  // × 1.37 はMediaPipeランドマーク（肩関節中心）とメジャー計測点（肩の外端）の差を補正する係数
  const shoulderWidth = ratios
    ? Math.round(ratios.shoulderWidthRatio * height * 0.82 * 1.37 * 10) / 10
    : Math.round(height * 0.24 * 10) / 10;

  // ウエスト: WHtR（ウエスト÷身長比）をBMIと性別から推定
  // 標準BMI(22)でのWHtR: 男性0.455、女性0.430
  // BMIが22から1増えるごとにWHtRが約0.008増える（実測値ベースの近似）
  const baseWhtr = gender === "male" ? 0.455 : 0.430;
  const waist = Math.round((baseWhtr + (bmi - 22) * 0.008) * height * 10) / 10;

  return { bodyFatPct, muscleMass, shoulderWidth, waist };
}
