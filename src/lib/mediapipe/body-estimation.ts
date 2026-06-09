/**
 * MediaPipeの姿勢推定結果とユーザー入力から体組成を推定する。
 */

import type { BodyRatios } from "./pose";
import { NAVY, DEURENBERG, BODY, FAT_BOUNDS } from "./const";

/** スキャン画面で入力されるユーザーの基本情報と任意の周囲計測値 */
export interface UserInput {
  gender: "male" | "female";
  height: number;
  weight: number;
  age: number;
  neck?: number; // cm
  abdomen?: number; // cm
  hip?: number; // cm、女性のみ
}

/** 写真解析・推定式から算出した体組成の推定結果 */
export interface EstimatedBody {
  bodyFatPct: number; // %
  muscleMass: number; // kg
  shoulderWidth: number; // cm
  waist: number; // cm
  method: "navy" | "deurenberg";
}

/** 首回り・腹囲（女性はヒップも）から米海軍式で体脂肪率を計算する。計測値が不足している場合は null を返す */
function estimateByNavy(user: UserInput): number | null {
  const { gender, height, neck, abdomen, hip } = user;
  if (!neck || !abdomen) return null;

  if (gender === "male") {
    const diff = abdomen - neck;
    if (diff <= 0) return null;
    return (
      NAVY.MALE.A * Math.log10(diff) -
      NAVY.MALE.B * Math.log10(height) +
      NAVY.MALE.C
    );
  } else {
    if (!hip) return null;
    const sum = abdomen + hip - neck;
    if (sum <= 0) return null;
    return (
      NAVY.FEMALE.A * Math.log10(sum) -
      NAVY.FEMALE.B * Math.log10(height) +
      NAVY.FEMALE.C
    );
  }
}

/** BMI・年齢・性別からDeurenberg式で体脂肪率を計算する。周囲計測値がない場合のフォールバック */
function estimateByDeurenberg(user: UserInput): number {
  const { gender, weight, height, age } = user;
  const bmi = weight / (height / 100) ** 2;
  const constant =
    gender === "male" ? DEURENBERG.MALE_CONSTANT : DEURENBERG.FEMALE_CONSTANT;
  return DEURENBERG.BMI_COEFF * bmi + DEURENBERG.AGE_COEFF * age - constant;
}

/** MediaPipeの姿勢推定結果とユーザー入力を組み合わせて体組成を推定する */
export function estimateBody(
  user: UserInput,
  ratios: BodyRatios | null,
): EstimatedBody {
  const { gender, height, weight } = user;
  const fatMin = FAT_BOUNDS.MIN[gender];
  const fatMax = FAT_BOUNDS.MAX[gender];

  const navyRaw = estimateByNavy(user);
  const method: "navy" | "deurenberg" =
    navyRaw !== null ? "navy" : "deurenberg";
  const rawFat = navyRaw ?? estimateByDeurenberg(user);
  const bodyFatPct =
    Math.round(Math.max(fatMin, Math.min(fatMax, rawFat)) * 10) / 10;

  const leanMass = weight * (1 - bodyFatPct / 100);
  const muscleMass =
    Math.round(leanMass * BODY.SKELETAL_MUSCLE_RATIO * 10) / 10;

  // LANDMARK_CALIBRATION: ランドマーク11/12は肩関節中心を指すためメジャー計測点（肩峰）より内側になる。実測値との比較から導出。
  const shoulderWidth = ratios
    ? Math.round(
        ratios.shoulderWidthRatio *
          height *
          BODY.SHOULDER_ANKLE_RATIO *
          BODY.LANDMARK_CALIBRATION *
          10,
      ) / 10
    : Math.round(height * BODY.DEFAULT_SHOULDER_RATIO * 10) / 10;

  const waist = user.abdomen
    ? user.abdomen
    : (() => {
        const bmi = weight / (height / 100) ** 2;
        const baseWhtr =
          gender === "male" ? BODY.BASE_WHTR_MALE : BODY.BASE_WHTR_FEMALE;
        return (
          Math.round(
            (baseWhtr + (bmi - 22) * BODY.WHTR_PER_BMI) * height * 10,
          ) / 10
        );
      })();

  return { bodyFatPct, muscleMass, shoulderWidth, waist, method };
}
