"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Shield, Eye, EyeOff, Save, RefreshCw, Users, DollarSign,
  ToggleLeft, ToggleRight, Ban, RotateCcw, Settings, Lock,
  Moon, Sun, CheckCircle2, AlertCircle, Megaphone, Phone,
  CreditCard, Globe, Plus, Trash2, ChevronDown, ChevronUp,
  Image, Play, Bell, Layout, Zap
} from "lucide-react";

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

const AD_TYPE_INFO: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  banner: { label: "BANNER", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Image, desc: "Shows rectangle image/text ads on page" },
  multi: { label: "ALL-IN-ONE", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: Layout, desc: "Banner + Video + Popunder - everything" },
  native: { label: "NATIVE", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Zap, desc: "Content recommendation ads below articles" },
  push: { label: "PUSH", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Bell, desc: "Browser push notification ads" },
};

export default function AdminPage() {
  const mounted = useRef(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT);
  const [originalSettings, setOriginalSettings] = useState<AdminSettings>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type:"success"|"error",text:string}|null>(null);
  const [ipInput, setIpInput] = useState("");
  const [expandedAd, setExpandedAd] = useState<string|null>(null);
  const [adFilter, setAdFilter] = useState<string>("all");
  const { theme, setTheme } = useTheme();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setIsMounted(true)); return ()=> cancelAnimationFrame(r); }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await fetch("/api/admin-settings");
      if (r.ok) {
        const d = await r.json();
        const mergedAds = DEFAULT_ADS.map(def => {
          const existing = d.settings.adPlatforms?.find((a: AdPlatform) => a.id === def.id);
          return existing ? { ...def, ...existing, adType: def.adType || existing.adType } : def;
        });
        const customAds = (d.settings.adPlatforms || []).filter((a: AdPlatform) => !DEFAULT_ADS.find(d => d.id === a.id));
        const finalSettings = { ...DEFAULT, ...d.settings, adPlatforms: [...mergedAds, ...customAds] };
        setSettings(finalSettings);
        setOriginalSettings(finalSettings);
      }
    } catch {}
  }, []);

  const handleLogin = async () => {
    if (!password.trim()) return;
    try {
      const r = await fetch("/api/admin-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, settings: {} }) });
      if (r.ok) { setAuthenticated(true); await fetchSettings(); setMessage({ type: "success", text: "Login successful!" }); }
      else { setMessage({ type: "error", text: "Wrong password!" }); }
    } catch { setMessage({ type: "error", text: "Connection error" }); }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, settings }) });
      if (r.ok) { const d = await r.json(); setOriginalSettings(settings); setMessage({ type: "success", text: "Settings saved!" }); }
      else { setMessage({ type: "error", text: "Failed to save" }); }
    } catch { setMessage({ type: "error", text: "Connection error" }); }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReset = async () => {
    if (!confirm("Reset ALL settings to default?")) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, reset: true }) });
      if (r.ok) { const d = await r.json(); setSettings(DEFAULT); setOriginalSettings(DEFAULT); setMessage({ type: "success", text: "Settings reset!" }); }
    } catch {}
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleBlockIp = async () => {
    if (!ipInput.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, action: "block", ip: ipInput.trim() }) });
      if (r.ok) { const d = await r.json(); setSettings(prev => ({...prev, blockedIps: [...prev.blockedIps, ipInput.trim()]})); setIpInput(""); setMessage({ type: "success", text: `IP ${ipInput} blocked!` }); }
    } catch {}
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUnblockIp = async (ip: string) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, action: "unblock", ip }) });
      if (r.ok) { setSettings(prev => ({...prev, blockedIps: prev.blockedIps.filter(i => i !== ip)})); setMessage({ type: "success", text: `IP ${ip} unblocked!` }); }
    } catch {}
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const update = <K extends keyof AdminSettings>(key: K, val: AdminSettings[K]) => setSettings(prev => ({...prev, [key]: val}));

  const updateAd = (idx: number, field: keyof AdPlatform, val: string|boolean) => {
    setSettings(prev => {
      const ads = [...prev.adPlatforms];
      ads[idx] = { ...ads[idx], [field]: val };
      return { ...prev, adPlatforms: ads };
    });
  };

  const addCustomAd = () => {
    const id = `custom-${Date.now()}`;
    const newAd: AdPlatform = { id, name: "Custom Ad", clientId: "", slotId: "", enabled: false, scriptUrl: "", adType: "banner" };
    setSettings(prev => ({ ...prev, adPlatforms: [...prev.adPlatforms, newAd] }));
    setExpandedAd(id);
  };

  const removeAd = (id: string) => {
    if (!confirm("Remove this ad platform?")) return;
    setSettings(prev => ({ ...prev, adPlatforms: prev.adPlatforms.filter(a => a.id !== id) }));
  };

  const activeAdsCount = settings.adPlatforms.filter(a => a.enabled).length;

  const filteredAds = adFilter === "all"
    ? settings.adPlatforms
    : adFilter === "active"
    ? settings.adPlatforms.filter(a => a.enabled)
    : settings.adPlatforms.filter(a => a.adType === adFilter);

  if (!isMounted) return (
    <div style={{minHeight:"100vh",background:"#09090b",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
      <div style={{width:"40px",height:"40px",border:"4px solid #dc2626",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#ffffff",fontSize:"14px",fontWeight:"600"}}>Loading...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-3"><Shield size={28} className="text-white"/></div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground mt-1">YT SEO Toolkit - Control Center</p>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter admin password" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 pr-10"/>
                <button onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
              {message && (<div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs ${message.type==="success"?"bg-green-500/10 text-green-500":"bg-red-500/10 text-red-500"}`}>{message.type==="success"?<CheckCircle2 size={14}/>:<AlertCircle size={14}/>}{message.text}</div>)}
              <button onClick={handleLogin} disabled={!password.trim()} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium text-sm hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"><Lock size={15}/> Login</button>
            </div>
            <div className="mt-4 flex justify-end"><button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="p-2 rounded-lg hover:bg-accent transition-colors">{theme==="dark"?<Sun size={16}/>:<Moon size={16}/>}</button></div>
          </div>
        </div>
      </div>
    );
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield size={20} className="text-red-500"/><h1 className="text-base font-bold">Admin Panel</h1></div>
          <div className="flex items-center gap-2">
            {hasChanges && <span className="text-[10px] text-yellow-500 font-medium animate-pulse">Unsaved changes</span>}
            <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="p-2 rounded-lg hover:bg-accent transition-colors">{theme==="dark"?<Sun size={16}/>:<Moon size={16}/>}</button>
            <button onClick={()=>setAuthenticated(false)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {message && (<div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${message.type==="success"?"bg-green-500/10 text-green-500":"bg-red-500/10 text-red-500"}`}>{message.type==="success"?<CheckCircle2 size={14}/>:<AlertCircle size={14}/>}{message.text}</div>)}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {icon:Users,label:"Free Limit",value:`${settings.freeLimit}/day`},
            {icon:DollarSign,label:"Pro Price",value:`$${settings.proPrice}`},
            {icon:DollarSign,label:"Enterprise",value:`$${settings.enterprisePrice}`},
            {icon:Megaphone,label:"Active Ads",value:`${activeAdsCount}`},
          ].map((s,i)=>(
            <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
              <s.icon size={18} className="mx-auto mb-1 text-muted-foreground"/>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
              <div className="text-sm font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4"><DollarSign size={16} className="text-green-500"/>Subscription Pricing</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="text-xs">Free Plan - Daily Thumb Limit</span>
              <input type="number" min={1} max={100} value={settings.freeLimit} onChange={e=>update("freeLimit",parseInt(e.target.value)||5)} className="w-20 px-2 py-1 rounded-lg bg-card border border-border text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"/>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="text-xs">Pro Plan ($/month)</span>
              <input type="number" min={0} max={999} value={settings.proPrice} onChange={e=>update("proPrice",parseInt(e.target.value)||0)} className="w-20 px-2 py-1 rounded-lg bg-card border border-border text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"/>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="text-xs">Enterprise Plan ($/month)</span>
              <input type="number" min={0} max={999} value={settings.enterprisePrice} onChange={e=>update("enterprisePrice",parseInt(e.target.value)||0)} className="w-20 px-2 py-1 rounded-lg bg-card border border-border text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"/>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-1"><CreditCard size={16} className="text-pink-500"/>Payment Settings (JazzCash)</h2>
          <p className="text-[10px] text-muted-foreground mb-4">Users see this number when subscribing. Change anytime.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="text-xs">JazzCash Number</span>
              <input type="text" value={settings.jazzcashNumber} onChange={e=>update("jazzcashNumber",e.target.value)} placeholder="03225415760" className="w-36 px-2 py-1 rounded-lg bg-card border border-border text-xs text-right focus:outline-none focus:ring-1 focus:ring-pink-500"/>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="text-xs">Account Name</span>
              <input type="text" value={settings.jazzcashName} onChange={e=>update("jazzcashName",e.target.value)} placeholder="Your Name" className="w-36 px-2 py-1 rounded-lg bg-card border border-border text-xs text-right focus:outline-none focus:ring-1 focus:ring-pink-500"/>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <div><span className="text-xs font-medium">Payment Active</span><span className="block text-[10px] text-muted-foreground">Show payment info when price &gt; $0</span></div>
              <button onClick={()=>update("paymentEnabled",!settings.paymentEnabled)} className="text-green-500">{settings.paymentEnabled?<ToggleRight size={28}/>:<ToggleLeft size={28} className="text-muted-foreground"/>}</button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold flex items-center gap-2"><Megaphone size={16} className="text-blue-500"/>Ad Platforms</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">{activeAdsCount} active / {settings.adPlatforms.length} total</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">Enable platforms and add IDs. Ads show on website automatically.</p>

          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {[
              {id:"all",label:"All",count:settings.adPlatforms.length},
              {id:"active",label:"Active",count:activeAdsCount},
              {id:"banner",label:"Banner",count:settings.adPlatforms.filter(a=>a.adType==="banner").length},
              {id:"multi",label:"Mu
