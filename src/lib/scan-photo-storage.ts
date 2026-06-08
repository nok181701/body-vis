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

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:image/jpeg;base64,XXXX" の "XXXX" 部分のみ取り出す
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
