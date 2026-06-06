import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Smartphone, Trash2, CheckCircle2, Loader2, Link2, Save } from "lucide-react";

interface Release {
  id: string;
  version: string;
  file_path: string;
  file_url: string;
  file_size_bytes: number | null;
  release_notes: string | null;
  is_active: boolean;
  created_at: string;
}

const formatBytes = (b: number | null) => {
  if (!b) return "—";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const MobileAppManager = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Store links state
  const [linksId, setLinksId] = useState<string | null>(null);
  const [googlePlayUrl, setGooglePlayUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [appCenterUrl, setAppCenterUrl] = useState("");
  const [savingLinks, setSavingLinks] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("mobile_app_releases")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReleases(data as Release[]);
  };

  const loadLinks = async () => {
    const { data } = await supabase
      .from("mobile_app_store_links")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setLinksId(data.id);
      setGooglePlayUrl(data.google_play_url || "");
      setAppCenterUrl(data.app_center_url || "");
    }
  };

  useEffect(() => { load(); loadLinks(); }, []);

  const saveLinks = async () => {
    setSavingLinks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        google_play_url: googlePlayUrl.trim() || null,
        app_center_url: appCenterUrl.trim() || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };
      if (linksId) {
        const { error } = await supabase.from("mobile_app_store_links").update(payload).eq("id", linksId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("mobile_app_store_links").insert(payload).select().single();
        if (error) throw error;
        if (data) setLinksId(data.id);
      }
      toast({ title: "Store links saved", description: "Public buttons updated immediately." });
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    } finally {
      setSavingLinks(false);
    }
  };


  const handleUpload = async () => {
    if (!file || !version.trim()) {
      toast({ title: "Missing info", description: "Please choose an APK file and enter a version.", variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(10);

    try {
      const filePath = `releases/v${version}-${Date.now()}.apk`;
      setProgress(30);

      const { error: upErr } = await supabase.storage
        .from("mobile-app")
        .upload(filePath, file, {
          contentType: "application/vnd.android.package-archive",
          upsert: false,
        });

      if (upErr) throw upErr;
      setProgress(75);

      const { data: pub } = supabase.storage.from("mobile-app").getPublicUrl(filePath);

      // Deactivate previous releases
      await supabase.from("mobile_app_releases").update({ is_active: false }).eq("is_active", true);

      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("mobile_app_releases").insert({
        version: version.trim(),
        file_path: filePath,
        file_url: pub.publicUrl,
        file_size_bytes: file.size,
        release_notes: notes.trim() || null,
        is_active: true,
        uploaded_by: user?.id,
      });

      if (insErr) throw insErr;

      setProgress(100);
      toast({ title: "APK uploaded", description: `v${version} is now live for customers.` });
      setVersion(""); setNotes(""); setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const toggleActive = async (r: Release) => {
    if (!r.is_active) {
      await supabase.from("mobile_app_releases").update({ is_active: false }).eq("is_active", true);
    }
    await supabase.from("mobile_app_releases").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  };

  const removeRelease = async (r: Release) => {
    if (!confirm(`Delete v${r.version}? This will remove the APK from storage.`)) return;
    await supabase.storage.from("mobile-app").remove([r.file_path]);
    await supabase.from("mobile_app_releases").delete().eq("id", r.id);
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Store & Install Links
          </CardTitle>
          <CardDescription>
            Set the public download links shown on the website. Leave the Google Play URL empty to display a "Soon" badge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gp">Google Play Store URL</Label>
            <Input id="gp" value={googlePlayUrl} onChange={(e) => setGooglePlayUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." />
            <p className="text-xs text-muted-foreground mt-1">
              Status: {googlePlayUrl.trim() ? <span className="text-green-600 font-medium">LIVE</span> : <span className="text-amber-600 font-medium">SOON (pending link)</span>}
            </p>
          </div>
          <div>
            <Label htmlFor="ac">App Center URL (Loadly)</Label>
            <Input id="ac" value={appCenterUrl} onChange={(e) => setAppCenterUrl(e.target.value)} placeholder="https://loadly.io/justice-auto-app" />
            <p className="text-xs text-muted-foreground mt-1">
              Status: {appCenterUrl.trim() ? <span className="text-green-600 font-medium">LIVE</span> : <span className="text-amber-600 font-medium">SOON (pending link)</span>}
            </p>
          </div>
          <Button onClick={saveLinks} disabled={savingLinks}>
            {savingLinks ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save Links</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" /> Mobile App Releases
          </CardTitle>
          <CardDescription>
            Upload the Android APK customers will download. No file size limit — upload any size you need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="version">Version</Label>
              <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.0.0" />
            </div>
            <div>
              <Label htmlFor="apk">APK File (.apk) — no size limit</Label>
              <Input
                id="apk"
                ref={inputRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: <strong>{file.name}</strong> · {formatBytes(file.size)}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Release Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What's new in this version..." />
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading} className="bg-green-600 hover:bg-green-700">
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4 mr-2" /> Upload APK</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Releases ({releases.length})</CardTitle></CardHeader>
        <CardContent>
          {releases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No releases uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {releases.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">v{r.version}</span>
                      {r.is_active && <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>}
                      <span className="text-xs text-muted-foreground">{formatBytes(r.file_size_bytes)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    {r.release_notes && <p className="text-sm text-muted-foreground mt-1 truncate">{r.release_notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                      <span className="text-xs text-muted-foreground hidden sm:inline">{r.is_active ? "Live" : "Off"}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeRelease(r)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileAppManager;
