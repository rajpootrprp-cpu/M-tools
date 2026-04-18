import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), ".admin-settings.json");
const SETTINGS_KEY = "yt-seo-admin-settings";

interface AdPlatform {
  id: string; name: string; clientId: string; slotId: string;
  enabled: boolean; scriptUrl: string; adType?: string;
}

interface AdminSettings {
  freeLimit: number; proPrice: number; enterprisePrice: number;
  faceSwapEnabled: boolean; characterReplaceEnabled: boolean;
  blockedIps: string[]; maintenanceMode: boolean;
  jazzcashNumber: string; jazzcashName: string; paymentEnabled: boolean;
  adPlatforms: AdPlatform[];
}

const DEFAULT_ADS: AdPlatform[] = [
  { id: "google-adsense", name: "Google AdSense (Banner+Video)", clientId: "", slotId: "", enabled: false, scriptUrl: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={CLIENT_ID}", adType: "banner" },
  { id: "propellerads", name: "PropellerAds (Banner+Video+Pop)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "adsterra", name: "Adsterra (Banner+Video+Pop)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "monetag", name: "Monetag (Video+Banner+Native)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "media-net", name: "Media.net (Yahoo Banner)", clientId: "", slotId: "", enabled: false, scriptUrl: "https://contextual.media.net/dmedianet.js?cid={CLIENT_ID}", adType: "banner" },
  { id: "taboola", name: "Taboola (Native/Content)", clientId: "", slotId: "", enabled: false, scriptUrl: "https://cdn.taboola.com/libtrc/{CLIENT_ID}/loader.js", adType: "native" },
  { id: "mgid", name: "MGID (Native/Content)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "native" },
  { id: "outbrain", name: "Outbrain (Native/Content)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "native" },
  { id: "hilltopads", name: "HilltopAds (Video+Pop)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "richpush", name: "RichPush (Push+Pop)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "ad-maven", name: "AdMaven (Video+Pop+Banner)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "clickadu", name: "Clickadu (Pop+Banner)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "popcash", name: "PopCash (Popunder)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "push-ads", name: "Push.js (Push Notifications)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "push" },
  { id: "notix", name: "Notix (Push Notifications)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "push" },
  { id: "ezoic", name: "Ezoic (Auto Optimize)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "banner" },
  { id: "infolinks", name: "Infolinks (In-Text Ads)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "native" },
  { id: "revcontent", name: "Revcontent (Native)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "native" },
  { id: "yllix", name: "Yllix (Banner+Pop)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
  { id: "evadav", name: "EvaDav (Native+Video+Pop)", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "multi" },
];

const DEFAULT: AdminSettings = {
  freeLimit: 5, proPrice: 0, enterprisePrice: 0,
  faceSwapEnabled: false, characterReplaceEnabled: false,
  blockedIps: [], maintenanceMode: false,
  jazzcashNumber: "03225415760", jazzcashName: "JazzCash", paymentEnabled: true,
  adPlatforms: DEFAULT_ADS,
};

let kvCache: any = null;
async function getKv() {
  if (kvCache) return kvCache;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try { const mod = await import("@vercel/kv"); kvCache = mod.kv; return kvCache; } catch { return null; }
}

async function readSettings(): Promise<AdminSettings> {
  try {
    const kv = await getKv();
    if (kv) { const data = await kv.get<AdminSettings>(SETTINGS_KEY); if (data) { if (!data.adPlatforms) data.adPlatforms = DEFAULT_ADS; return { ...DEFAULT, ...data }; } }
  } catch {}
  try { const data = await fs.readFile(SETTINGS_FILE, "utf-8"); const parsed = JSON.parse(data); if (!parsed.adPlatforms) parsed.adPlatforms = DEFAULT_ADS; return { ...DEFAULT, ...parsed }; } catch { return DEFAULT; }
}

async function writeSettings(s: AdminSettings) {
  try { const kv = await getKv(); if (kv) { await kv.set(SETTINGS_KEY, JSON.stringify(s)); return; } } catch {}
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

export async function GET() {
  const s = await readSettings();
  return NextResponse.json({ settings: s });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, settings } = body;
    const pw = process.env.ADMIN_PASSWORD || "admin123";
    if (password !== pw) return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    if (!settings) return NextResponse.json({ error: "Settings object required" }, { status: 400 });
    const current = await readSettings();
    const updated = { ...current, ...settings };
    await writeSettings(updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const pw = process.env.ADMIN_PASSWORD || "admin123";
    if (body.password !== pw) return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    const current = await readSettings();
    if (body.action === "block" && body.ip) {
      if (!current.blockedIps.includes(body.ip)) current.blockedIps.push(body.ip);
    } else if (body.action === "unblock" && body.ip) {
      current.blockedIps = current.blockedIps.filter((i: string) => i !== body.ip);
    } else if (body.reset === true) {
      await writeSettings(DEFAULT);
      return NextResponse.json({ success: true, settings: DEFAULT });
    }
    await writeSettings(current);
    return NextResponse.json({ success: true, settings: current });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
    }
