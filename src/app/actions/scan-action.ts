"use server";

import { createScan, getScan } from "@/lib/bodygram/api";
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
    throw new Error(`Scan failed with error: ${scan.error?.code ?? "unknown"}`);
  }

  if (scan.status === "processing") {
    throw new Error("Scan timed out while processing");
  }

  return scan;
}
