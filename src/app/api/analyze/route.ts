import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Allow longer processing for video analysis
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert hardware engineer and technical writer. Analyze this video of a physical system or device. Identify all key components, chips, ports, or mechanical parts visible. Return ONLY a valid JSON array. Each element must have these exact keys: "timestamp" (seconds as integer), "component" (short name string), "description" (2-sentence string explaining the component's function), "tips" (1 maintenance or troubleshooting tip string). Do not include any preamble, explanation, or markdown code fences — just the raw JSON array.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured. Add your key to .env.local" },
      { status: 500 }
    );
  }

  try {
    const { videoBase64, mimeType } = await req.json();

    if (!videoBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing videoBase64 or mimeType in request body" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: videoBase64,
        },
      },
      SYSTEM_PROMPT,
    ]);

    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      // Retry once with stricter instruction if JSON parsing fails
      const retryResult = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: videoBase64,
          },
        },
        SYSTEM_PROMPT +
          " CRITICAL: Ensure output is valid JSON only — no markdown wrapping, no extra text. Just a raw JSON array.",
      ]);

      const retryText = retryResult.response.text();
      const retryClean = retryText.replace(/```json|```/g, "").trim();
      const retryParsed = JSON.parse(retryClean);
      return NextResponse.json(retryParsed);
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze video. Please check your API key and try again.",
      },
      { status: 500 }
    );
  }
}
