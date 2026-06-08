import type { CreateScanRequestPhotoFields, Scan } from "@/types/bodygram";

const API_BASE_URL = "https://platform.bodygram.com/api";

interface BodygramCredentials {
  apiKey: string;
  organizationId: string;
}

// Bodygram側がスキャンを失敗と判定したときのエラー（コードを画面表示用に保持する）
export class ScanFailedError extends Error {
  code: string;

  constructor(code: string) {
    super(`Bodygram scan failed: ${code}`);
    this.name = "ScanFailedError";
    this.code = code;
  }
}

export async function createScan(
  credentials: BodygramCredentials,
  data: CreateScanRequestPhotoFields
): Promise<Scan> {
  const response = await fetch(
    `${API_BASE_URL}/orgs/${credentials.organizationId}/scans`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: credentials.apiKey,
      },
      body: JSON.stringify({ photoScan: data }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create scan: ${response.status} - ${errorBody}`
    );
  }

  const responseData = await response.json();
  return responseData.entry as Scan;
}

export async function getScan(
  credentials: BodygramCredentials,
  scanId: string
): Promise<Scan> {
  const response = await fetch(
    `${API_BASE_URL}/orgs/${credentials.organizationId}/scans/${scanId}`,
    {
      method: "GET",
      headers: {
        Authorization: credentials.apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get scan: ${response.statusText}`);
  }

  const responseData = await response.json();
  return responseData.entry as Scan;
}
