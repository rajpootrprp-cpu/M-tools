import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const maxDuration = 60;

const STYLE_PROMPTS: Record<string, string> = {
  gaming: "YouTube thumbnail for gaming content. NO text. Only visual imagery related to: ",
  vlog: "YouTube thumbnail for vlog content. NO text. Only visual imagery related to: ",
  tutorial: "YouTube thumbnail for tutorial content. NO text. Only visual imagery related to: ",
  news: "YouTube thumbnail for news content. NO text. Only visual imagery related to: ",
  reaction: "YouTube thumbnail for reaction content. NO text. Only visual imagery related to: ",
  music: "YouTube thumbnail for music content. NO text. Only visual imagery related to: ",
  tech: "YouTube thumbnail for tech content. NO text. Only visual imagery related to: ",
  cooking: "YouTube thumbnail for cooking content. NO text. Only visual imagery related to: ",
};

export async function POST(req: NextRequest) {
  try {
    const { topic, style, referenceImage } = await req.json();
    if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const selectedStyle = STYLE_PROMPTS[style] || STYLE_PROMPTS.gaming;
    let prompt = `${selectedStyle}${topic}. Create a visually striking thumbnail image. Use cinematic lighting, bold colors, professional composition. NO text overlays, NO words, NO letters. Pure visual image only.`;

    if (referenceImage) {
      prompt = `${selectedStyle}${topic}. The user has provided a reference image - create a thumbnail inspired by its style and composition. Use cinematic lighting, bold colors, professional composition. NO text overlays, NO words, NO letters. Pure visual image only.`;
    }

    try {
      const zai = await ZAI.create();
      const response = await zai.images.generations.create({
        prompt,
        size: "1344x768",
      });

      const imageBase64 = response.data?.[0]?.base64;
      if (!imageBase64) return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });

      return NextResponse.json({ image: imageBase64, success: true });
    } catch (aiErr) {
      console.log("ThumbGen AI fallback:", aiErr);
      return NextResponse.json({
        error: "Image generation is temporarily busy. Please try again in 30 seconds.",
        retry: true,
      }, { status: 503 });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to generate thumbnail" }, { status: 500 });
  }
        }
