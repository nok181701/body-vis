/**
 * 側面写真から胸・ウエスト・ヒップの前後奥行きを計測する。
 *
 * 処理フロー:
 *   1. PoseLandmarker で肩・腰・足首の Y 座標を取得し、ピクセル→cm 変換係数を算出
 *   2. ImageSegmenter（selfie_segmenter）でボディマスクを取得
 *   3. 胸・ウエスト・ヒップの高さでマスクの横幅を計測 → 側面での横幅 = 前後奥行き
 */

import { FilesetResolver, ImageSegmenter, PoseLandmarker } from "@mediapipe/tasks-vision";
import { BODY } from "./const";

export interface SideDepths {
  chestDepth: number;  // cm（胸部の前後奥行き）
  waistDepth: number;  // cm（ウエストの前後奥行き）
  hipDepth: number;    // cm（ヒップの前後奥行き）
}

// 肩から腰方向への各測定位置（胴体長に対する比率）
const CHEST_TORSO_RATIO = 0.25;
const WAIST_TORSO_RATIO = 0.65;

// ノイズ低減のために上下 WINDOW_ROWS 行を平均する
const WINDOW_ROWS = 7;

// 人物とみなす confidence 閾値
const PERSON_THRESHOLD = 0.5;

let segmenter: ImageSegmenter | null = null;
let landmarker: PoseLandmarker | null = null;

async function getModels(): Promise<{
  segmenter: ImageSegmenter;
  landmarker: PoseLandmarker;
}> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

  if (!segmenter) {
    segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      outputConfidenceMasks: true,
    });
  }

  if (!landmarker) {
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
    });
  }

  return { segmenter, landmarker };
}

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * 指定行の周辺 WINDOW_ROWS 行を平均し、人物ピクセルの横幅（px）を返す。
 * 人物領域が検出できなかった行は平均から除外する。
 */
function measureWidthAtRow(
  mask: Float32Array,
  imageWidth: number,
  imageHeight: number,
  targetRow: number,
): number {
  const half = Math.floor(WINDOW_ROWS / 2);
  let totalWidth = 0;
  let count = 0;

  for (let dr = -half; dr <= half; dr++) {
    const row = Math.round(targetRow + dr);
    if (row < 0 || row >= imageHeight) continue;

    let minX = imageWidth;
    let maxX = -1;

    for (let x = 0; x < imageWidth; x++) {
      if (mask[row * imageWidth + x] > PERSON_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    if (maxX >= 0) {
      totalWidth += maxX - minX;
      count++;
    }
  }

  return count > 0 ? totalWidth / count : 0;
}

/**
 * 側面写真を解析して胸・ウエスト・ヒップの前後奥行きを返す。
 * ランドマーク未検出またはマスク取得失敗の場合は null を返す（上流でフォールバックを使う）。
 */
export async function analyzeSidePhoto(
  base64Image: string,
  heightCm: number,
): Promise<SideDepths | null> {
  const { segmenter: seg, landmarker: lm } = await getModels();
  const img = await loadImage(base64Image);

  // PoseLandmarker でスケール基準となる肩・腰・足首の Y 座標を取得
  const poseResult = lm.detect(img);
  if (!poseResult.landmarks || poseResult.landmarks.length === 0) return null;

  const lms = poseResult.landmarks[0];
  // 側面では手前側のランドマークを優先して取得する
  const shoulder = lms[12] ?? lms[11];
  const hip = lms[24] ?? lms[23];
  const ankle = lms[28] ?? lms[27] ?? null;

  if (!shoulder || !hip) return null;

  const H = img.naturalHeight;
  const W = img.naturalWidth;

  const shoulderY_px = shoulder.y * H;
  const hipY_px = hip.y * H;
  const ankleY_px = ankle ? ankle.y * H : null;

  // ピクセル→cm 変換係数: 肩〜足首の実距離から算出（足首不可なら胴体長×2で代替）
  const shoulderToAnkle_px = ankleY_px !== null
    ? ankleY_px - shoulderY_px
    : (hipY_px - shoulderY_px) * 2;

  if (shoulderToAnkle_px <= 0) return null;

  const cmPerPx = (heightCm * BODY.SHOULDER_ANKLE_RATIO) / shoulderToAnkle_px;

  // ImageSegmenter でボディマスクを取得
  const segResult = seg.segment(img);
  const confidenceMask = segResult.confidenceMasks?.[0];
  if (!confidenceMask) return null;

  const maskData = confidenceMask.getAsFloat32Array();
  confidenceMask.close();

  // 胸・ウエスト・ヒップの行位置を算出して横幅（= 奥行き）を計測
  const torsoHeight_px = hipY_px - shoulderY_px;

  const chestRow = shoulderY_px + torsoHeight_px * CHEST_TORSO_RATIO;
  const waistRow = shoulderY_px + torsoHeight_px * WAIST_TORSO_RATIO;
  const hipRow = hipY_px;

  const chestPx = measureWidthAtRow(maskData, W, H, chestRow);
  const waistPx = measureWidthAtRow(maskData, W, H, waistRow);
  const hipPx = measureWidthAtRow(maskData, W, H, hipRow);

  if (chestPx === 0 || hipPx === 0) return null;

  return {
    chestDepth: Math.round(chestPx * cmPerPx * 10) / 10,
    waistDepth: waistPx > 0 ? Math.round(waistPx * cmPerPx * 10) / 10 : 0,
    hipDepth: Math.round(hipPx * cmPerPx * 10) / 10,
  };
}
