/**
 * バーチャル試着結果（本人写真/試着後画像）をsessionStorageに一時保存・取得・削除する。
 * base64データをURLパラメータに含めず、ページ間で受け渡すために使用する。
 * 値は `data:image/...;base64,...` 形式のData URLで保持する。
 */

const STORAGE_KEY = "bodyvis:try-on-result";

export interface TryOnResult {
  /** アップロードされた本人写真そのもの */
  personImage: string;
  /** Gemini APIで生成した試着後の画像 */
  tryOnImage: string;
}

export function saveTryOnResult(result: TryOnResult) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadTryOnResult(): TryOnResult | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TryOnResult;
  } catch {
    return null;
  }
}

export function clearTryOnResult() {
  sessionStorage.removeItem(STORAGE_KEY);
}
