/**
 * 体型推定に使う定数
 */

// 体型比率・補正係数
export const BODY = {
  SHOULDER_ANKLE_RATIO: 0.82,    // 肩〜足首のピクセル高 / 全身ピクセル高
  LANDMARK_CALIBRATION: 1.37,    // MediaPipeランドマーク（肩関節中心）→ 実測点（肩峰）への補正係数
  DEFAULT_SHOULDER_RATIO: 0.24,  // MediaPipe未使用時の肩幅フォールバック（身長比）
  BASE_WHTR_MALE: 0.455,         // BMI 22 における男性のウエスト身長比
  BASE_WHTR_FEMALE: 0.43,        // BMI 22 における女性のウエスト身長比
  WHTR_PER_BMI: 0.008,           // BMI が 1 増えるごとのウエスト身長比の増分
};

// 肢長・周長推定に使う係数
export const LIMB = {
  // 股下
  INSEAM_CROTCH_OFFSET: 5,       // 腰関節ランドマーク〜股下の垂直オフセット (cm)
  INSEAM_FALLBACK_RATIO: 0.45,   // MediaPipe不使用時の股下/身長比フォールバック

  // 袖丈（後頸点〜手首）
  SLEEVE_NECK_OFFSET: 8,         // 後頸点〜肩峰のオフセット (cm)
  SLEEVE_FALLBACK_RATIO: 0.33,   // MediaPipe不使用時の袖丈/身長比フォールバック

  // ヒップランドマーク補正
  HIP_CALIBRATION: 1.10,         // 腰関節ランドマーク → 実測ヒップ幅への補正係数

  // 楕円断面近似: 胸部の幅/奥行き比
  BUST_TO_SHOULDER_RATIO_MALE: 0.87,    // 胸幅/肩幅比（男性）
  BUST_TO_SHOULDER_RATIO_FEMALE: 0.78,  // 胸幅/肩幅比（女性）
  BUST_DEPTH_WIDTH_RATIO_MALE: 0.68,    // 胸部奥行き/胸幅比（男性）
  BUST_DEPTH_WIDTH_RATIO_FEMALE: 0.88,  // 胸部奥行き/胸幅比（女性）

  // 楕円断面近似: ヒップの奥行き/幅比
  HIP_DEPTH_WIDTH_RATIO_MALE: 0.82,
  HIP_DEPTH_WIDTH_RATIO_FEMALE: 0.90,

  // 首回り推定（身長比 + BMI補正）
  NECK_GIRTH_RATIO_MALE: 0.197,
  NECK_GIRTH_RATIO_FEMALE: 0.168,
  NECK_BMI_COEFF: 0.15,          // BMI が 22 から 1 増えるごとの首回りの増分 (cm)
};
