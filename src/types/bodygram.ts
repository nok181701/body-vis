// スキャン作成リクエストのボディ（身長はmm、体重はgで送信する）
export interface CreateScanRequestPhotoFields {
  age: number;
  weight: number;
  height: number;
  gender: "male" | "female";
  frontPhoto: string;
  rightPhoto: string;
}

// 個別の身体計測値（waist, chest, hipなど。値はmm単位）
export interface Measurement {
  name: string;
  value: number;
  unit: "mm";
}

// 体組成の推定値（体脂肪率・筋肉量など）
export interface BodyComposition {
  bodyFatPercentage?: number;
  skeletalMuscleMass?: number;
  [key: string]: number | undefined;
}

// スキャン失敗時のエラー情報
export interface ScanError {
  code: string;
  message?: string;
}

// Bodygramスキャン結果（成功時にmeasurements/bodyCompositionが入る）
export interface Scan {
  id: string;
  status: "success" | "failure" | "processing";
  entryDate: number;
  measurements?: Measurement[];
  bodyComposition?: BodyComposition;
  error?: ScanError;
}
