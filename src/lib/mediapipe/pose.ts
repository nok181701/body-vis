/**
 * MediaPipe PoseLandmarker を使って正面写真から体型比率を検出する。
 * 肩・腰・足首・手首のランドマーク座標を取得し、各部位の比率を計算して返す。
 */

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

// ポーズから計算した体型比率（正規化座標ベース）
export interface BodyRatios {
  shoulderWidthRatio: number;   // 肩幅 ÷ 肩〜足首の長さ
  hipWidthRatio: number;        // 腰幅 ÷ 肩〜足首の長さ
  torsoHeightRatio: number;     // 胴体長 ÷ 肩〜足首の長さ
  shoulderToHipRatio: number;   // 肩幅 ÷ 腰幅
  inseamRatio: number | null;   // (足首Y − 腰Y) ÷ bodyHeight。足首が見切れた場合 null
  sleeveRatio: number | null;   // 肩〜手首のユークリッド距離 ÷ bodyHeight。手首が見切れた場合 null
}

// 同一セッションで複数回初期化しないようシングルトンで保持する
let landmarker: PoseLandmarker | null = null;

async function getLandmarker(): Promise<PoseLandmarker> {
  if (landmarker) return landmarker;

  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numPoses: 1,
  });

  return landmarker;
}

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

// 人物が検出できない場合は null を返す（上流で fallback 値を使う）
export async function detectBodyRatios(
  base64Image: string,
): Promise<BodyRatios | null> {
  const lm = await getLandmarker();
  const img = await loadImage(base64Image);

  // IMAGE モードでは detect() は同期的に結果を返す
  const result = lm.detect(img);
  if (!result.landmarks || result.landmarks.length === 0) return null;

  const lms = result.landmarks[0];
  // ランドマーク番号:
  //   11=左肩, 12=右肩
  //   15=左手首, 16=右手首
  //   23=左腰, 24=右腰
  //   27=左足首, 28=右足首
  const leftShoulder = lms[11];
  const rightShoulder = lms[12];
  const leftWrist = lms[15];
  const rightWrist = lms[16];
  const leftHip = lms[23];
  const rightHip = lms[24];
  const leftAnkle = lms[27];
  const rightAnkle = lms[28];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const hipWidth = Math.abs(rightHip.x - leftHip.x);
  const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const midHipY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = Math.abs(midHipY - midShoulderY);

  // 肩から足首の距離でスケールを正規化する（足首が見切れている場合は胴体長×2で代替）
  const anklesVisible = !!(leftAnkle && rightAnkle);
  const midAnkleY = anklesVisible
    ? (leftAnkle!.y + rightAnkle!.y) / 2
    : null;
  const bodyHeight = midAnkleY !== null
    ? Math.abs(midAnkleY - midShoulderY)
    : torsoHeight * 2;

  if (bodyHeight === 0) return null;

  // x は画像幅、y は画像高さで独立して正規化されているため、
  // x / y の比率はそのままでは実際の比率と異なる。画像のアスペクト比で補正する。
  const aspectRatio = img.naturalWidth / img.naturalHeight;

  // 股下比率: 腰〜足首のY距離（両方Y座標なのでアスペクト比補正不要）
  const inseamRatio = midAnkleY !== null
    ? (midAnkleY - midHipY) / bodyHeight
    : null;

  // 袖丈比率: 右肩〜右手首（なければ左）のユークリッド距離 ÷ bodyHeight
  let sleeveRatio: number | null = null;
  const wrist = rightWrist ?? leftWrist ?? null;
  const shoulderForSleeve = rightWrist ? rightShoulder : leftWrist ? leftShoulder : null;
  if (wrist && shoulderForSleeve) {
    const dx = (wrist.x - shoulderForSleeve.x) * aspectRatio;
    const dy = wrist.y - shoulderForSleeve.y;
    sleeveRatio = Math.sqrt(dx * dx + dy * dy) / bodyHeight;
  }

  return {
    shoulderWidthRatio: (shoulderWidth / bodyHeight) * aspectRatio,
    hipWidthRatio: (hipWidth / bodyHeight) * aspectRatio,
    torsoHeightRatio: torsoHeight / bodyHeight,
    shoulderToHipRatio: hipWidth > 0 ? shoulderWidth / hipWidth : 1.0,
    inseamRatio,
    sleeveRatio,
  };
}
