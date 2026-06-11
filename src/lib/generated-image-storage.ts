/**
 * 体型アバター画像（現在/目標）をsessionStorageに一時保存・取得・削除する。
 * base64データをURLパラメータに含めず、ページ間で受け渡すために使用する。
 * 値は `data:image/...;base64,...` 形式のData URLで保持する。
 */

const STORAGE_KEY = "bodyvis:generated-images";

export interface GeneratedImages {
  /** アップロードされた元写真そのもの（Geminiでは加工しない） */
  currentImage: string;
  /** Gemini APIで生成した目標体型の画像 */
  goalImage: string;
}

export function saveGeneratedImages(images: GeneratedImages) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

export function loadGeneratedImages(): GeneratedImages | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeneratedImages;
  } catch {
    return null;
  }
}

export function clearGeneratedImages() {
  sessionStorage.removeItem(STORAGE_KEY);
}
