"use server";

import { GoogleGenAI } from "@google/genai";
import {
  buildPrompt,
  GEMINI_IMAGE_MODEL,
  NEGATIVE_PROMPT,
  SAFETY_SETTINGS,
  type Gender,
} from "@/lib/gemini/avatar-prompt";
import { FAT_BOUNDS } from "@/lib/mediapipe/const";

export interface GenerateAvatarParams {
  photo: string;
  gender: Gender;
  height: number;
  bodyFatPct: number;
  /** 現在の体重（kg） */
  weightKg: number;
  /** 現在体重から見た体重差（kg）。マイナスで減量、プラスで増量、0で現在体型のまま */
  weightDiffKg: number;
}

export type GenerateAvatarResult =
  | { success: true; image: string }
  | { success: false; error: string };

function isValidParams(params: GenerateAvatarParams): boolean {
  const { photo, gender, height, bodyFatPct } = params;
  if (!photo) return false;
  if (gender !== "male" && gender !== "female") return false;
  if (height < 100 || height > 250) return false;
  if (bodyFatPct < FAT_BOUNDS.MIN[gender] || bodyFatPct > FAT_BOUNDS.MAX[gender]) return false;
  return true;
}

// Gemini API（gemini-3-pro-image-preview）で体型アバター画像を生成するServer Action
export async function generateAvatar(params: GenerateAvatarParams): Promise<GenerateAvatarResult> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "サーバーにGemini APIキーが設定されていません" };
  }

  if (!isValidParams(params)) {
    return { success: false, error: "リクエストパラメータが不正です" };
  }

  const { photo, gender, height, bodyFatPct, weightKg, weightDiffKg } = params;
  const prompt = `${buildPrompt(gender, bodyFatPct, height, weightKg, weightDiffKg)}. Avoid: ${NEGATIVE_PROMPT}.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: photo, mimeType: "image/jpeg" } },
            { text: prompt },
          ],
        },
      ],
      config: {
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const image = response.data;
    if (!image) {
      return { success: false, error: "画像を生成できませんでした。表現を変えて再度お試しください" };
    }

    return { success: true, image };
  } catch (error) {
    console.error("Gemini画像生成エラー:", error);
    return { success: false, error: "画像生成中にエラーが発生しました" };
  }
}
