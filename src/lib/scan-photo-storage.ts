const STORAGE_KEY = "bodyvis:scan-photos";

export interface ScanPhotos {
  front: string;
  side: string;
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

// Bodygram APIが要求する解像度（720x1280〜1080x1920、縦横比9:16）に合わせる
const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;
const JPEG_QUALITY = 0.85;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
      const sourceRatio = image.width / image.height;

      // 縦横比9:16に合わせて中央をクロップする範囲を求める
      let sx = 0;
      let sy = 0;
      let sWidth = image.width;
      let sHeight = image.height;
      if (sourceRatio > targetRatio) {
        sWidth = image.height * targetRatio;
        sx = (image.width - sWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        sHeight = image.width / targetRatio;
        sy = (image.height - sHeight) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context is not available"));
        return;
      }

      ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
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
