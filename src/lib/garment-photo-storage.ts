/**
 * 試着する服の画像を sessionStorage に一時保存・取得・削除する。
 * 値は base64文字列（data URLのプレフィックスなし）で保持する。
 */

const STORAGE_KEY = "bodyvis:garment-photo";

export function saveGarmentPhoto(photo: string) {
  sessionStorage.setItem(STORAGE_KEY, photo);
}

export function loadGarmentPhoto(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearGarmentPhoto() {
  sessionStorage.removeItem(STORAGE_KEY);
}
