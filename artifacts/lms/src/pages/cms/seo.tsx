import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Globe, Search, Share2, RefreshCw, CheckCircle2, ExternalLink,
  Info, FileCode, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface SeoContent {
  siteTitle?: string;
  titleTemplate?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
  ogImage?: string;
  twitterHandle?: string;
  twitterCard?: string;
  googleSiteVerification?: string;
  noIndex?: boolean;
  customHeadHtml?: string;
  robotsTxt?: string;
  homepageTitle?: string;
  homepageDescription?: string;
  coursesPageTitle?: string;
  coursesPageDescription?: string;
}

const SECTION_KEY = "seo";

async function fetchSeo(): Promise<SeoContent> {
  const r = await fetch("/api/tenant-cms/sections", { credentials: "include" });
  if (!r.ok) return {};
  const rows: Array<{ sectionKey: string; content: Record<string, unknown> }> = await r.json();
  const row = rows.find((s) => s.sectionKey.endsWith(`_${SECTION_KEY}`));
  return (row?.content ?? {}) as SeoContent;
}

async function saveSeo(content: SeoContent): Promise<void> {
  const r = await fetch(`/api/tenant-cms/sections/${SECTION_KEY}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, label: "SEO Settings" }),
  });
  if (!r.ok) throw new Error("Save failed");
}

/* ── Character count indicator ─────────────────────────────────────────────── */
function CharCount({ value, max, warn }: { value: string; max: number; warn: number }) {
  const len = value.length;
  const color = len > max ? "text-red-500" : len > warn ? "text-amber-500" : "text-muted-foreground";
  return (
    <span className={`text-xs ${color}`}>{len}/{max}</span>
  );
}

/* ── Preview card ────────────────────────────────────────────────────────────── */
function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-zinc-900 max-w-lg">
      <p className="text-xs text-green-700 dark:text-green-400 mb-1 truncate">{url || "https://yoursite.com"}</p>
      <p className="text-[#1a0dab] dark:text-blue-400 text-lg font-medium leading-snug truncate hover:underline cursor-pointer">
        {title || "Page Title"}
      </p>
      <p className="text-sm text-[#4d5156] dark:text-zinc-300 mt-1 line-clamp-2 leading-snug">
        {description || "Page meta description will appear here."}
      </p>
    </div>
  );
}

function TwitterPreview({ title, description, image, card }: { title: string; description: string; image: string; card: string }) {
  return (
    <div className="border rounded-xl overflow-hidden max-w-sm bg-white dark:bg-zinc-900">
      {image && card === "summary_large_image" && (
        <img src={image} alt="OG" className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-1">yoursite.com</p>
        <p className="font-semibold text-sm truncate">{title || "Page Title"}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description || "Description"}</p>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function CmsSeo() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: saved, isLoading } = useQuery({ queryKey: ["cms-seo"], queryFn: fetchSeo });

  const [form, setForm] = useState<SeoContent>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (saved) { setForm(saved); setDirty(false); }
  }, [saved]);

  function set(key: keyof SeoContent, val: string | boolean) {
    setForm((p) => ({ ...p, [key]: val }));
    setDirty(true);
  }

  const mutation = useMutation({
    mutationFn: () => saveSeo(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-seo"] });
      qc.invalidateQueries({ queryKey: ["tenant-cms-sections-public"] });
      setDirty(false);
      toast({ title: "SEO settings saved", description: "Changes are live on your public pages." });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const previewTitle = form.homepageTitle || `${form.siteTitle || "Your Academy"} — ${form.defaultDescription?.slice(0, 40) || "IELTS Preparation"}`;
  const previewDesc  = form.homepageDescription || form.defaultDescription || "";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            SEO Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control how your public pages appear in search engines and social media.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} className="gap-2">
          {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {dirty ? "Save Changes" : "Saved"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* ── General ─────────────────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" />Site Identity</CardTitle>
              <CardDescription>Default SEO values used across all public pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Site / Academy Name</label>
                </div>
                <Input value={form.siteTitle || ""} onChange={(e) => set("siteTitle", e.target.value)} placeholder="e.g. British Council IELTS Academy" />
                <p className="text-xs text-muted-foreground mt-1">Used as the suffix in page titles, e.g. "IELTS Reading Course | British Council"</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Title Template</label>
                </div>
                <Input value={form.titleTemplate || ""} onChange={(e) => set("titleTemplate", e.target.value)} placeholder="%s | British Council IELTS" />
                <p className="text-xs text-muted-foreground mt-1">Use %s as a placeholder for the page name. Leave blank to use plain title.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Default Meta Description</label>
                  <CharCount value={form.defaultDescription || ""} max={160} warn={140} />
                </div>
                <Textarea
                  rows={3}
                  value={form.defaultDescription || ""}
                  onChange={(e) => set("defaultDescription", e.target.value)}
                  placeholder="Prepare for IELTS with expert-led courses, mock tests, and personalised feedback. Band 7+ guaranteed."
                />
                <p className="text-xs text-muted-foreground mt-1">Keep between 120–160 characters. Used when a page has no specific description.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Default Keywords</label>
                </div>
                <Input value={form.defaultKeywords || ""} onChange={(e) => set("defaultKeywords", e.target.value)} placeholder="IELTS, IELTS preparation, IELTS online course, band 7, IELTS writing" />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated. Less important for Google but helps other search engines.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" />Default Social Image (OG)</CardTitle>
              <CardDescription>Shown when your pages are shared on social media. Recommended: 1200×630 px.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={form.ogImage || ""} onChange={(e) => set("ogImage", e.target.value)} placeholder="https://cdn.example.com/og-default.jpg" />
              {form.ogImage && (
                <img src={form.ogImage} alt="OG preview" className="rounded border h-28 w-auto object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Live Google Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <GooglePreview title={previewTitle} description={previewDesc} url={`https://yoursite.com`} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pages ───────────────────────────────────────────────────────────── */}
        <TabsContent value="pages" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Homepage SEO</CardTitle>
              <CardDescription>Specific title and description for your homepage (/)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Homepage Title</label>
                  <CharCount value={form.homepageTitle || ""} max={60} warn={50} />
                </div>
                <Input value={form.homepageTitle || ""} onChange={(e) => set("homepageTitle", e.target.value)} placeholder="IELTS Preparation | Band 7+ Guaranteed" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Homepage Meta Description</label>
                  <CharCount value={form.homepageDescription || ""} max={160} warn={140} />
                </div>
                <Textarea rows={3} value={form.homepageDescription || ""} onChange={(e) => set("homepageDescription", e.target.value)} placeholder="Join thousands of students who achieved Band 7+ with our expert-led IELTS courses." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Courses Listing Page SEO</CardTitle>
              <CardDescription>Specific title and description for the /courses-list page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Page Title</label>
                  <CharCount value={form.coursesPageTitle || ""} max={60} warn={50} />
                </div>
                <Input value={form.coursesPageTitle || ""} onChange={(e) => set("coursesPageTitle", e.target.value)} placeholder="IELTS Courses | Reading, Writing, Listening & Speaking" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Page Meta Description</label>
                  <CharCount value={form.coursesPageDescription || ""} max={160} warn={140} />
                </div>
                <Textarea rows={3} value={form.coursesPageDescription || ""} onChange={(e) => set("coursesPageDescription", e.target.value)} placeholder="Browse all IELTS preparation courses. Expert instructors, flexible learning, proven results." />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/40 p-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Course detail pages automatically use the course title and description as their SEO title and meta description. No additional configuration needed.
            </p>
          </div>
        </TabsContent>

        {/* ── Social ──────────────────────────────────────────────────────────── */}
        <TabsContent value="social" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Share2 className="w-4 h-4" />Open Graph & Twitter</CardTitle>
              <CardDescription>Controls how links to your site appear when shared on social platforms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Twitter Card Type</label>
                <div className="flex gap-3">
                  {["summary", "summary_large_image"].map((v) => (
                    <button
                      key={v}
                      onClick={() => set("twitterCard", v)}
                      className={`flex-1 px-3 py-2.5 text-xs font-medium border rounded-lg transition-colors ${
                        (form.twitterCard || "summary_large_image") === v
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {v === "summary" ? "Summary (small thumbnail)" : "Large image card"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Twitter Handle</label>
                <Input value={form.twitterHandle || ""} onChange={(e) => set("twitterHandle", e.target.value)} placeholder="@youracademy" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Twitter Card Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <TwitterPreview
                title={previewTitle}
                description={previewDesc}
                image={form.ogImage || ""}
                card={form.twitterCard || "summary_large_image"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Advanced ────────────────────────────────────────────────────────── */}
        <TabsContent value="advanced" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Google Search Console</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="text-sm font-medium block mb-1">Site Verification Meta Tag Content</label>
              <Input value={form.googleSiteVerification || ""} onChange={(e) => set("googleSiteVerification", e.target.value)} placeholder="paste the content= value from Google Search Console" />
              <p className="text-xs text-muted-foreground mt-1">Paste only the value from the content="..." attribute of the meta tag Google gives you.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="w-4 h-4" />robots.txt
              </CardTitle>
              <CardDescription>
                Controls which pages search engine crawlers can access.
                Available at <Badge variant="outline" className="font-mono text-xs">/api/tenant/robots.txt</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                value={form.robotsTxt || ""}
                onChange={(e) => set("robotsTxt", e.target.value)}
                placeholder={`User-agent: *\nAllow: /\nDisallow: /student/\nDisallow: /admin-login\n\nSitemap: https://yoursite.com/api/tenant/sitemap.xml`}
                className="font-mono text-xs"
              />
              <div className="flex items-center gap-2">
                <a
                  href="/api/tenant/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />View live robots.txt
                </a>
                <span className="text-muted-foreground text-xs">·</span>
                <a
                  href="/api/tenant/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />View live sitemap.xml
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Index Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.noIndex === true}
                  onChange={(e) => set("noIndex", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <p className="text-sm font-medium">Prevent search engine indexing (noindex)</p>
                  <p className="text-xs text-muted-foreground">Check this during development or if you don't want public pages indexed yet.</p>
                </div>
              </label>
            </CardContent>
          </Card>

          {form.googleSiteVerification && (
            <div className="rounded-lg border border-green-100 bg-green-50 dark:bg-green-950/20 p-4 flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-800 dark:text-green-300">
                Google verification meta tag is configured and will be injected on all public pages.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
