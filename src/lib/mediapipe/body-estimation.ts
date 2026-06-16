/**
 * MediaPipeの姿勢推定結果・側面解析結果・ユーザー入力から体型各部の寸法を推定する。
 *
 * 側面写真が提供された場合: 胸囲・ヒップは実測奥行きを使って楕円断面から計算
 * 側面写真なしの場合: 統計的な奥行き比率（性別別の平均値）で推定
 */

import type { BodyRatios } from "./pose";
import type { SideDepths } from "./side-silhouette";
import { BODY, LIMB } from "./const";

/** スキャン画面で入力されるユーザーの基本情報と任意の周囲計測値 */
export interface UserInput {
  gender: "male" | "female";
  height: number;
  weight: number;
  age: number;
  neck?: number;    // cm（首回り直接入力）
  abdomen?: number; // cm（ウエスト直接入力）
  hip?: number;     // cm（ヒップ直接入力、女性のみ）
}

/** 写真解析・推定式から算出した体型寸法 */
export interface EstimatedBody {
  shoulderWidth: number;    // cm（肩幅）
  bustGirth: number;        // cm（胸囲）
  waist: number;            // cm（ウエスト）
  hipGirth: number;         // cm（ヒップ）
  insideLegHeight: number;  // cm（股下）
  sleeveLength: number;     // cm（袖丈）
  neckGirth: number;        // cm（首回り）
}

/**
 * 楕円断面近似で周長を算出する。
 * width と depth はそれぞれ断面の直径（半径ではない）。
 * 楕円の周長 ≈ π(a + b) で、a = width/2、b = depth/2 なので π(width + depth)/2
 */
function ellipseGirth(width: number, depth: number): number {
  return Math.round((Math.PI * (width + depth)) / 2 * 10) / 10;
}

/** MediaPipeの姿勢推定結果とユーザー入力を組み合わせて体型各部の寸法を推定する */
export function estimateBody(
  user: UserInput,
  ratios: BodyRatios | null,
  sideDepths: SideDepths | null = null,
): EstimatedBody {
  const { gender, height, weight } = user;
  const bmi = weight / (height / 100) ** 2;

  // 肩幅: LANDMARK_CALIBRATION は肩関節中心 → 肩峰（実測点）への補正
  const shoulderWidth = ratios
    ? Math.round(
        ratios.shoulderWidthRatio *
          height *
          BODY.SHOULDER_ANKLE_RATIO *
          BODY.LANDMARK_CALIBRATION *
          10,
      ) / 10
    : Math.round(height * BODY.DEFAULT_SHOULDER_RATIO * 10) / 10;

  // 胸囲: 肩幅から胸幅を推定し、奥行きと合わせて楕円断面で周長を算出
  // 側面計測値があれば実測奥行きを使用、なければ統計的な比率で代替
  const bustWidth =
    shoulderWidth *
    (gender === "male"
      ? LIMB.BUST_TO_SHOULDER_RATIO_MALE
      : LIMB.BUST_TO_SHOULDER_RATIO_FEMALE);
  const bustDepth =
    sideDepths?.chestDepth ??
    bustWidth *
      (gender === "male"
        ? LIMB.BUST_DEPTH_WIDTH_RATIO_MALE
        : LIMB.BUST_DEPTH_WIDTH_RATIO_FEMALE);
  const bustGirth = ellipseGirth(bustWidth, bustDepth);

  // ウエスト: 直接入力があればその値を使用。なければBMIからWHtRを推定
  const waist = user.abdomen
    ? user.abdomen
    : (() => {
        const baseWhtr =
          gender === "male" ? BODY.BASE_WHTR_MALE : BODY.BASE_WHTR_FEMALE;
        return (
          Math.round(
            (baseWhtr + (bmi - 22) * BODY.WHTR_PER_BMI) * height * 10,
          ) / 10
        );
      })();

  // ヒップ: MediaPipeの腰幅比率 → 実寸幅 → 楕円断面で周長を算出
  // 直接入力 > 側面実測 > 統計比率の優先順
  const hipGirth = (() => {
    if (user.hip) return user.hip;

    const hipWidth = ratios
      ? Math.round(
          ratios.hipWidthRatio *
            height *
            BODY.SHOULDER_ANKLE_RATIO *
            LIMB.HIP_CALIBRATION *
            10,
        ) / 10
      : shoulderWidth * 0.95;

    const hipDepth =
      sideDepths?.hipDepth ??
      hipWidth *
        (gender === "male"
          ? LIMB.HIP_DEPTH_WIDTH_RATIO_MALE
          : LIMB.HIP_DEPTH_WIDTH_RATIO_FEMALE);

    return ellipseGirth(hipWidth, hipDepth);
  })();

  // 股下: MediaPipeの腰〜足首比率 × 身長スケール（腰関節〜股下オフセットを減算）
  const insideLegHeight =
    ratios?.inseamRatio != null
      ? Math.max(
          Math.round(
            (ratios.inseamRatio * height * BODY.SHOULDER_ANKLE_RATIO -
              LIMB.INSEAM_CROTCH_OFFSET) *
              10,
          ) / 10,
          0,
        )
      : Math.round(height * LIMB.INSEAM_FALLBACK_RATIO * 10) / 10;

  // 袖丈: MediaPipeの肩〜手首距離比率 × 身長スケール + 後頸点〜肩峰オフセット
  const sleeveLength =
    ratios?.sleeveRatio != null
      ? Math.round(
          (ratios.sleeveRatio * height * BODY.SHOULDER_ANKLE_RATIO +
            LIMB.SLEEVE_NECK_OFFSET) *
            10,
        ) / 10
      : Math.round(height * LIMB.SLEEVE_FALLBACK_RATIO * 10) / 10;

  // 首回り: 直接入力があればその値を使用。なければ身長比 × 性別係数 + BMI補正で推定
  const neckGirth = user.neck
    ? user.neck
    : Math.round(
        (height *
          (gender === "male"
            ? LIMB.NECK_GIRTH_RATIO_MALE
            : LIMB.NECK_GIRTH_RATIO_FEMALE) +
          (bmi - 22) * LIMB.NECK_BMI_COEFF) *
          10,
      ) / 10;

  return {
    shoulderWidth,
    bustGirth,
    waist,
    hipGirth,
    insideLegHeight,
    sleeveLength,
    neckGirth,
  };
}
