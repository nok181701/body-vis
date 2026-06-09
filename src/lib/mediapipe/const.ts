/**
 * 体組成推定に使う定数
 * 各推定式の係数や体型比率の補正値を定義する。
 */

// 米海軍式（周囲長法）の係数
export const NAVY = {
  MALE: { A: 86.01, B: 70.041, C: 36.76 },
  FEMALE: { A: 163.205, B: 97.684, C: 78.387 },
};

// Deurenberg式（BMI・年齢・性別から体脂肪率を推定）の係数
export const DEURENBERG = {
  BMI_COEFF: 1.2,
  AGE_COEFF: 0.23,
  MALE_CONSTANT: 16.2, // 10.8 + 5.4
  FEMALE_CONSTANT: 5.4,
};

// 体組成推定に使う比率・補正係数
export const BODY = {
  SKELETAL_MUSCLE_RATIO: 0.55, // 骨格筋量 = 除脂肪体重 × 0.55
  SHOULDER_ANKLE_RATIO: 0.82, // 肩〜足首のピクセル高 / 全身ピクセル高
  LANDMARK_CALIBRATION: 1.37, // MediaPipeランドマーク（肩関節中心）→ 実測点（肩峰）への補正係数
  DEFAULT_SHOULDER_RATIO: 0.24, // MediaPipe未使用時の肩幅フォールバック（身長比）
  BASE_WHTR_MALE: 0.455, // BMI 22 における男性のウエスト身長比
  BASE_WHTR_FEMALE: 0.43, // BMI 22 における女性のウエスト身長比
  WHTR_PER_BMI: 0.008, // BMI が 1 増えるごとのウエスト身長比の増分
};

// 体脂肪率の生理学的な上下限
export const FAT_BOUNDS = {
  MIN: { male: 5, female: 12 },
  MAX: { male: 50, female: 55 },
};
