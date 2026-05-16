import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Eye, EyeOff, Plus, X, Tag, Globe,
  FileText, Image, Clock, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Post = {
  id?: number; title: string; slug: string; excerpt: string;
  content: string; coverImage: string; author: string;
  status: string; tags: string[];
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchAllPosts() {
  const r = await fetch("/api/tenant-cms/posts", { credentials: "include" });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

const PLACEHOLDER_CONTENT = `## Introduction

Write a brief introduction here…

## Main Content

Add your main content here. Markdown is fully supported:

- **Bold text** with double asterisks
- *Italic text* with single asterisks
- [Link text](https://example.com)

## Summary

Wrap up your post with a clear summary.
`;

export default function PostEditor() {
  const { id: idStr } = useParams<{ id: string }>();
  const isNew = idStr === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);

  const [form, setForm] = useState<Post>({
    title: "", slug: "", excerpt: "", content: "",
    coverImage: "", author: "Academy Admin", status: "draft", tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const { data: allPosts, isLoading } = useQuery({
    queryKey: ["tenant-cms-posts"],
    queryFn: fetchAllPosts,
    enabled: !isNew,
  });

  useEffect(() => {
    if (!isNew && allPosts) {
      const existing = allPosts.find((p: any) => p.id === Number(idStr));
      if (existing) {
        const rawSlug: string = existing.slug ?? "";
        const cleanSlug = rawSlug.replace(/^t\d+-/, "");
        setForm({
          title: existing.title ?? "",
          slug: cleanSlug,
          excerpt: existing.excerpt ?? "",
          content: existing.content ?? "",
          coverImage: existing.coverImage ?? "",
          author: existing.author ?? "Academy Admin",
          status: existing.status ?? "draft",
          tags: existing.tags ?? [],
        });
        setSlugManual(true);
      }
    }
  }, [allPosts, isNew, idStr]);

  const saveMutation = useMutation({
    mutationFn: async (data: Post) => {
      const url = isNew ? "/api/tenant-cms/posts" : `/api/tenant-cms/posts/${idStr}`;
      const method = isNew ? "POST" : "PUT";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Save failed"); }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-cms-posts"] });
      toast({ title: isNew ? "Post created" : "Post saved" });
      if (isNew) setLocation(`/cms/posts/${data.id}`);
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, ...(slugManual ? {} : { slug: slugify(title) }) }));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };
  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(wordCount / 200));

  if (!isNew && isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="sm"
            onClick={() => setLocation("/cms/posts")}
            className="-ml-2 text-muted-foreground gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />Back to Posts
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-bold">{isNew ? "New Post" : "Edit Post"}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={form.status === "published" ? "default" : "secondary"}
            className="capitalize"
          >
            {form.status === "published"
              ? <><Globe className="w-3 h-3 mr-1" />Published</>
              : <><FileText className="w-3 h-3 mr-1" />Draft</>}
          </Badge>
          <Button
            variant="outline" size="sm"
            onClick={() => setForm((f) => ({ ...f, status: f.status === "published" ? "draft" : "published" }))}
            className="gap-1.5"
          >
            {form.status === "published"
              ? <><EyeOff className="w-3.5 h-3.5" />Unpublish</>
              : <><Eye className="w-3.5 h-3.5" />Publish</>}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={saveMutation.isPending || !form.title.trim()}
            onClick={() => saveMutation.mutate(form)}
          >
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <Label className="text-xs mb-1.5 block font-medium">Post Title *</Label>
            <Input
              placeholder="e.g. How to Achieve Band 8 in IELTS Reading"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-base font-medium"
            />
          </div>

          {/* Excerpt */}
          <div>
            <Label className="text-xs mb-1.5 block font-medium">Excerpt / Summary</Label>
            <Textarea
              placeholder="A short description shown on post listings and SEO previews…"
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="resize-none"
            />
          </div>

          {/* Content editor with preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium">
                Content
                <span className="text-muted-foreground ml-2 font-normal">
                  {wordCount} words · ~{readMins} min read
                </span>
              </Label>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Markdown supported</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>
            {previewMode ? (
              <div
                className="min-h-[400px] border rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none text-sm bg-muted/20"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
              />
            ) : (
              <Textarea
                placeholder={PLACEHOLDER_CONTENT}
                rows={20}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="resize-y font-mono text-sm min-h-[400px]"
              />
            )}
          </div>
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-5">
          {/* Post details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block font-medium">URL Slug *</Label>
                <Input
                  placeholder="my-post-title"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  /blog/{form.slug || "my-post-title"}
                </p>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-medium">Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="Academy Admin"
                />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-medium">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />Draft
                      </span>
                    </SelectItem>
                    <SelectItem value="published">
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />Published
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Image className="w-3.5 h-3.5" />Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="https://…/image.jpg"
                value={form.coverImage}
                onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                className="text-sm"
              />
              {form.coverImage && (
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="rounded-lg w-full h-32 object-cover bg-muted"
                />
              )}
              {!form.coverImage && (
                <div className="rounded-lg w-full h-24 bg-muted flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground/40" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. ielts, tips, writing"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="icon" className="flex-shrink-0" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 text-xs">
                      <Tag className="w-2.5 h-2.5" />{t}
                      <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {form.tags.length === 0 && (
                <p className="text-xs text-muted-foreground">Add tags to help students find this post.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick save */}
          <Button
            className="w-full gap-2"
            disabled={saveMutation.isPending || !form.title.trim()}
            onClick={() => saveMutation.mutate(form)}
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving…" : isNew ? "Create Post" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Simple markdown renderer ─────────────────────────────────────── */
function renderMarkdown(md: string): string {
  if (!md) return '<p class="text-muted-foreground italic">Nothing to preview yet.</p>';
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3 class='text-base font-bold mt-4 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-bold mt-5 mb-2'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-xl font-bold mt-6 mb-2'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-muted px-1 py-0.5 rounded text-xs font-mono'>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>')
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc text-sm'>$1</li>")
    .replace(/(<li.*<\/li>)/s, "<ul class='my-2 space-y-1'>$1</ul>")
    .replace(/^(?!<[h|u|l|p])(.*\S.*)$/gm, "<p class='text-sm leading-relaxed'>$1</p>")
    .replace(/\n{2,}/g, "\n");
}
