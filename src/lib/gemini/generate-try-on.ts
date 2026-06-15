"use server";

import { GoogleGenAI } from "@google/genai";
import {
  NEGATIVE_PROMPT,
  SAFETY_SETTINGS,
  GEMINI_IMAGE_MODEL,
} from "@/lib/gemini/try-on-prompt";

export interface GenerateTryOnParams {
  /** 本人写真（base64、data URLのプレフィックスなし） */
  personPhoto: string;
  /** 服画像（base64、data URLのプレフィックスなし） */
  garmentPhoto: string;
  /** buildTryOnPromptで生成したプロンプト */
  prompt: string;
}

export type GenerateTryOnResult =
  | { success: true; image: string }
  | { success: false; error: string };

// Gemini API（gemini-3-pro-image-preview）でバーチャル試着画像を生成するServer Action
export async function generateTryOn(params: GenerateTryOnParams): Promise<GenerateTryOnResult> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "サーバーにGemini APIキーが設定されていません" };
  }

  const { personPhoto, garmentPhoto, prompt } = params;
  if (!personPhoto || !garmentPhoto || !prompt) {
    return { success: false, error: "リクエストパラメータが不正です" };
  }

  const fullPrompt = `${prompt} Avoid: ${NEGATIVE_PROMPT}.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: personPhoto, mimeType: "image/jpeg" } },
            { inlineData: { data: garmentPhoto, mimeType: "image/jpeg" } },
            { text: fullPrompt },
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
