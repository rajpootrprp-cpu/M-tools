import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    try {
      const zai = await ZAI.create();
      const res = await zai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a YouTube SEO expert. Respond ONLY with valid JSON, no markdown, no code blocks." },
          { role: "user", content: `Generate YouTube SEO metadata for: "${topic}". Return ONLY: {"title":"catchy title 100 chars","description":"SEO description 3 paragraphs","tags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15"],"hashtags":["#t1","#t2","#t3","#t4","#t5","#t6","#t7","#t8","#t9","#t10","#t11","#t12","#t13","#t14","#t15"]}` },
        ],
        temperature: 0.7,
      });

      let c = (res.choices?.[0]?.message?.content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const m = c.match(/\{[\s\S]*\}/);
      if (!m) return NextResponse.json({ error: "Parse error" }, { status: 500 });
      const d = JSON.parse(m[0]);
      return NextResponse.json({ title: d.title || "", description: d.description || "", tags: d.tags || [], hashtags: d.hashtags || [] });
    } catch (aiErr) {
      console.log("AI fallback triggered:", aiErr);
      const words = topic.toLowerCase().split(/\s+/);
      return NextResponse.json({
        title: `${topic} - Best Complete Guide ${new Date().getFullYear()}`,
        description: `In this video, we cover everything about ${topic}. Watch till the end to learn all the tips and tricks.\n\n${topic} is one of the most searched topics on YouTube. In this comprehensive guide, we break down all the important aspects you need to know about ${topic}.\n\nIf you found this video helpful, make sure to LIKE, SHARE, and SUBSCRIBE for more amazing content like this!`,
        tags: [topic, ...words, `${topic} tutorial`, `${topic} guide`, `${topic} tips`, `${topic} ${new Date().getFullYear()}`, `best ${topic}`, `${topic} for beginners`, `how to ${topic}`, `${topic} in urdu`, `${topic} hindi`],
        hashtags: [`#${words.join("")}`, `#${topic.replace(/\s/g,"")}`, "#trending", "#viral", "#youtube"]
      });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
    }
