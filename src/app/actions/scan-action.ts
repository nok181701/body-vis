"use server";

import { createScan, getScan, ScanFailedError } from "@/lib/bodygram/api";
import type { CreateScanRequestPhotoFields, Scan } from "@/types/bodygram";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

export async function createScanAction(
  data: CreateScanRequestPhotoFields
): Promise<Scan> {
  const apiKey = process.env.BODYGRAM_API_KEY;
  const orgId = process.env.BODYGRAM_ORG_ID;

  if (!apiKey || !orgId) {
    throw new Error("BODYGRAM_API_KEY and BODYGRAM_ORG_ID must be set");
  }

  const credentials = { apiKey, organizationId: orgId };

  try {
    let scan = await createScan(credentials, data);

    if (!scan.id) {
      throw new Error("Scan ID missing in create response");
    }

    for (
      let attempt = 0;
      attempt < MAX_POLL_ATTEMPTS && scan.status === "processing";
      attempt++
    ) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      scan = await getScan(credentials, scan.id);
    }

    if (scan.status === "failure") {
      throw new ScanFailedError(scan.error?.code ?? "unknown");
    }

    if (scan.status === "processing") {
      throw new Error("Scan timed out while processing");
    }

    // デバッグ用：計測項目の名前と値だけを一覧表示する（写真データは含まれない）
    console.log(
      "[createScanAction] measurements:",
      scan.measurements?.map((m) => `${m.name}: ${m.value}${m.unit}`)
    );
    console.log("[createScanAction] bodyComposition:", scan.bodyComposition);

    return scan;
  } catch (e) {
    // デバッグ用：写真データを含めず、エラー内容だけを出力する
    console.error("[createScanAction] failed:", e instanceof Error ? e.message : e);
    throw e;
  }
}
