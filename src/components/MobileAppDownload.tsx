import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Smartphone, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import appCenterIcon from "@/assets/appcenter-icon.webp.asset.json";

interface Release {
  version: string;
  file_url: string;
  file_size_bytes: number | null;
  release_notes: string | null;
}

interface StoreLinks {
  google_play_url: string | null;
  app_center_url: string | null;
}

interface Props {
  variant?: "full" | "compact";
}

const GooglePlayButton = ({ url, size = "default" }: { url: string | null; size?: "default" | "sm" }) => {
  const isSm = size === "sm";
  const isLive = !!url;
  const content = (
    <div
      className={`rainbow-border relative inline-flex items-center gap-2 ${isSm ? "px-3 py-1.5" : "px-4 py-2.5"} bg-black text-white rounded-lg select-none transition-transform hover:scale-105 ${!isLive ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <svg viewBox="0 0 512 512" className={isSm ? "h-5 w-5" : "h-7 w-7"} aria-hidden="true">
        <path fill="#00C1FF" d="M325.3 234.3 104.3 12.3l257.5 148.9z" />
        <path fill="#00D27A" d="M104.3 12.3v487.4L257.7 256z" />
        <path fill="#FFCE00" d="M361.8 350.8 104.3 499.7l221-221.6z" />
        <path fill="#FF3D00" d="M447.3 207 361.8 161.2 257.7 256l103.6 94.8 85.6-46.4c25.7-13.9 25.7-83.5.4-97.4z" />
      </svg>
      <div className="leading-tight text-left">
        <div className="text-[8px] uppercase tracking-wider opacity-80">Get it on</div>
        <div className={`font-semibold ${isSm ? "text-xs" : "text-sm"}`}>Google Play</div>
      </div>
      <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow ${isLive ? "bg-green-500 text-white" : "bg-accent text-accent-foreground"}`}>
        {isLive ? "LIVE" : "SOON"}
      </span>
    </div>
  );
  return isLive ? (
    <a href={url!} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : (
    <button type="button" disabled aria-label="Google Play coming soon">{content}</button>
  );
};

const AppCenterButton = ({ url, size = "default" }: { url: string | null; size?: "default" | "sm" }) => {
  const isSm = size === "sm";
  const isLive = !!url;
  const inner = (
    <div
      className={`rainbow-border relative inline-flex items-center gap-2 ${isSm ? "px-3 py-1.5" : "px-4 py-2.5"} bg-white text-black rounded-lg select-none transition-transform hover:scale-105 ${!isLive ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <img src={appCenterIcon.url} alt="App Center" className={isSm ? "h-5" : "h-7"} />
      <div className="leading-tight text-left">
        <div className="text-[8px] uppercase tracking-wider opacity-70">Install via</div>
        <div className={`font-semibold ${isSm ? "text-xs" : "text-sm"}`}>App Center</div>
      </div>
      <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow ${isLive ? "bg-green-500 text-white" : "bg-accent text-accent-foreground"}`}>
        {isLive ? "LIVE" : "SOON"}
      </span>
    </div>
  );
  return isLive ? (
    <a href={url!} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <button type="button" disabled>{inner}</button>
  );
};

const formatBytes = (b: number | null) => {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const MobileAppDownload = ({ variant = "full" }: Props) => {
  const [release, setRelease] = useState<Release | null>(null);
  const [links, setLinks] = useState<StoreLinks>({ google_play_url: null, app_center_url: "https://loadly.io/justice-auto-app" });
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "downloading" | "complete">("idle");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const [{ data: rel }, { data: lk }] = await Promise.all([
        supabase.from("mobile_app_releases").select("version,file_url,file_size_bytes,release_notes").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("mobile_app_store_links").select("google_play_url,app_center_url").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (rel) setRelease(rel as Release);
      if (lk) setLinks(lk as StoreLinks);
    })();
  }, []);

  const handleDownload = async () => {
    if (!release) {
      toast({ title: "Not available yet", description: "Our mobile app is being prepared. Please check back soon." });
      return;
    }
    setStatus("downloading");
    setProgress(0);

    try {
      const res = await fetch(release.file_url);
      if (!res.ok || !res.body) throw new Error("Download failed");
      const total = Number(res.headers.get("content-length")) || release.file_size_bytes || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total) setProgress(Math.min(99, Math.round((received / total) * 100)));
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: "application/vnd.android.package-archive" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JusticeUltimate-v${release.version}.apk`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setProgress(100);
      setStatus("complete");
      toast({ title: "Download complete!", description: "Open the APK file to proceed to install." });
    } catch (e: any) {
      setStatus("idle");
      setProgress(0);
      toast({ title: "Download failed", description: e.message || "Please try again.", variant: "destructive" });
    }
  };

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDownload}
                disabled={status === "downloading"}
                className="rainbow-border w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-70"
              >
                {status === "downloading" ? (
                  <>
                    <div className="h-2 w-24 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs">{progress}%</span>
                  </>
                ) : status === "complete" ? (
                  <><CheckCircle2 className="h-4 w-4" /> Proceed to Install</>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.523 15.341c-.355 0-.645-.29-.645-.645s.29-.646.645-.646.646.291.646.646-.291.645-.646.645zm-11.046 0c-.355 0-.646-.29-.646-.645s.291-.646.646-.646c.355 0 .645.291.645.646s-.29.645-.645.645zm11.277-6.155 1.286-2.228a.267.267 0 0 0-.464-.267l-1.302 2.255A8.32 8.32 0 0 0 12 7.728a8.32 8.32 0 0 0-3.274.218L7.424 5.691a.267.267 0 0 0-.464.267L8.246 8.186C5.998 9.405 4.5 11.578 4.5 14.062h15c0-2.484-1.498-4.657-3.746-5.876z"/></svg>
                    Download APK
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Download the official Android APK</p></TooltipContent>
          </Tooltip>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild><div><GooglePlayButton url={links.google_play_url} size="sm" /></div></TooltipTrigger>
              <TooltipContent><p>{links.google_play_url ? "Open on Google Play" : "Coming soon to Google Play"}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><div><AppCenterButton url={links.app_center_url} size="sm" /></div></TooltipTrigger>
              <TooltipContent><p>Install via App Center</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-primary/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Smartphone className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Get Our Mobile App</h3>
          <span className="ml-auto inline-flex items-center gap-1 text-xs bg-green-500/15 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
            <ShieldCheck className="h-3 w-3" /> Verified by Justice Ultimate
          </span>
        </div>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Browse our inventory, track orders, get instant offers and chat with 24/7 customer support — right from your phone.
          {release && <span className="block mt-1 text-xs">Current version: <strong>v{release.version}</strong> · {formatBytes(release.file_size_bytes)}</span>}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDownload}
                disabled={status === "downloading"}
                className="rainbow-border group relative inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 min-w-[240px]"
              >
                {status === "downloading" ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-200" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm tabular-nums">{progress}%</span>
                  </div>
                ) : status === "complete" ? (
                  <span className="inline-flex items-center gap-2 success-pulse rounded-md px-1">
                    <CheckCircle2 className="h-5 w-5" /> Proceed to Install
                  </span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                      <path d="M17.523 15.341c-.355 0-.645-.29-.645-.645s.29-.646.645-.646.646.291.646.646-.291.645-.646.645zm-11.046 0c-.355 0-.646-.29-.646-.645s.291-.646.646-.646c.355 0 .645.291.645.646s-.29.645-.645.645zm11.277-6.155 1.286-2.228a.267.267 0 0 0-.464-.267l-1.302 2.255A8.32 8.32 0 0 0 12 7.728a8.32 8.32 0 0 0-3.274.218L7.424 5.691a.267.267 0 0 0-.464.267L8.246 8.186C5.998 9.405 4.5 11.578 4.5 14.062h15c0-2.484-1.498-4.657-3.746-5.876z"/>
                    </svg>
                    <span className="text-base">Download Our Mobile App</span>
                    <Download className="h-4 w-4 opacity-80" />
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Download the official Android APK (.apk)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild><div><GooglePlayButton url={links.google_play_url} /></div></TooltipTrigger>
            <TooltipContent><p>{links.google_play_url ? "Open on Google Play" : "Coming soon to Google Play Store"}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild><div><AppCenterButton url={links.app_center_url} /></div></TooltipTrigger>
            <TooltipContent><p>Install via App Center (Loadly)</p></TooltipContent>
          </Tooltip>
        </div>

        {status === "complete" && (
          <p className="mt-4 text-sm text-green-700 dark:text-green-400">
            ✓ Download successful. Open the APK file from your downloads to install. You may need to allow installation from unknown sources.
          </p>
        )}

        <div className="mt-6 pt-5 border-t border-primary/10 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Signed & verified</span>
          <span>·</span>
          <span>Android 7.0+</span>
          <span>·</span>
          <span>24/7 in-app support</span>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MobileAppDownload;
