import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const INVIDIOUS = [
  "https://invidious.materialio.us","https://invidious.privacyredirect.com",
  "https://invidious.protokoll.zone","https://invidious.perennialte.ch",
  "https://iv.nbootu.nl","https://invidious.lunar.icu",
  "https://invidious.einfachzocken.eu","https://invidious.jing.rocks",
  "https://invidious.weblibre.org","https://vid.puffyan.us",
  "https://inv.nadeko.net","https://yewtu.be","https://invidious.nerdvpn.de",
  "https://yt.cdaut.de","https://inv.tux.pizza",
];

interface TrendVideo {
  videoId: string; title: string; channelName: string;
  thumbnailUrl: string; viewCount: string; duration: string; published: string;
}

function fmtCount(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

function fmtDur(seconds: number): string {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function extractVideos(data: any[], limit: number): TrendVideo[] {
  const videos: TrendVideo[] = [];
  for (const v of data.slice(0, limit)) {
    const thumbs = v.videoThumbnails || [];
    const thumb = thumbs.find((t: any) => t.quality === "medium")?.url
      || thumbs.find((t: any) => t.quality === "high")?.url
      || thumbs[0]?.url || "";
    videos.push({
      videoId: v.videoId, title: v.title || "", channelName: v.author || "",
      thumbnailUrl: thumb, viewCount: fmtCount(v.viewCount || 0),
      duration: fmtDur(v.lengthSeconds || 0), published: v.publishedText || "",
    });
  }
  return videos;
}

export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get("region") || "PK";
    const searchQuery = req.nextUrl.searchParams.get("q") || "";

    if (searchQuery.trim()) {
      for (const inst of INVIDIOUS) {
        try {
          const encoded = encodeURIComponent(searchQuery.trim());
          const r = await fetch(`${inst}/api/v1/search?q=${encoded}&type=video`, { signal: AbortSignal.timeout(10000) });
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data) && data.length > 0) {
              const videoResults = data.filter((v: any) => v.type === "video");
              if (videoResults.length > 0) {
                return NextResponse.json({ videos: extractVideos(videoResults, 20), fallback: false, searchQuery: searchQuery.trim() });
              }
            }
          }
        } catch { continue; }
      }
      return NextResponse.json({ videos: [], fallback: true, searchQuery: searchQuery.trim(), topics: [
        "AI Tools 2025","Gaming Setup","How to Earn Online","iPhone 17 Review",
        "Cricket Highlights","Best Laptops 2025","Travel Vlog Pakistan","Cooking Recipes",
      ]});
    }

    for (const inst of INVIDIOUS) {
      try {
        const r = await fetch(`${inst}/api/v1/trending?region=${region}`, { signal: AbortSignal.timeout(8000) });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length > 0) {
            const vids = extractVideos(data, 25);
            if (vids.length > 0) return NextResponse.json({ videos: vids, fallback: false });
          }
        }
      } catch { continue; }
    }

    return NextResponse.json({
      videos: [], fallback: true,
      topics: ["AI Tools 2025","Gaming Setup","How to Earn Online","iPhone 17 Review","Cricket Highlights","Best Laptops 2025","Travel Vlog Pakistan","Cooking Recipes","Fitness Workout","Free Fire Tips","PUBG Mobile","Blogging Tutorial","WhatsApp New Update","Elon Musk News","TikTok Viral Hacks","Study Tips for Exams"]
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
                                               }
