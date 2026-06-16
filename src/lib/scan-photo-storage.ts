/**
 * スキャン写真を sessionStorage に一時保存・取得・削除する。
 * 写真はサーバーに送らず、処理完了後に即破棄する。
 */

const STORAGE_KEY = "bodyvis:scan-photos";

export interface ScanPhotos {
  front: string;
  side?: string; // 側面写真（任意）
}

export function saveScanPhotos(photos: ScanPhotos) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

export function loadScanPhotos(): ScanPhotos | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScanPhotos;
  } catch {
    return null;
  }
}

export function clearScanPhotos() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// sessionStorage容量とGemini API送信サイズを考慮し、長辺1024px以内にリサイズする
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(image.width, image.height),
      );
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context is not available"));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);

      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      // "data:image/jpeg;base64,XXXX" の "XXXX" 部分のみ取り出す
      resolve(dataUrl.split(",")[1] ?? "");
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    image.src = objectUrl;
  });
}
