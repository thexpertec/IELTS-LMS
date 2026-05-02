import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, EyeOff, Plus, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Post = {
  id?: number; title: string; slug: string; excerpt: string;
  content: string; coverImage: string; author: string;
  status: string; tags: string[];
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchPost(slug: string) {
  const r = await fetch(`${BASE}/api/cms/posts/${slug}`, { credentials: "include" });
  if (!r.ok) throw new Error("Not found");
  return r.json();
}

export default function PostEditor() {
  const { id: idStr } = useParams<{ id: string }>();
  const isNew = idStr === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Post>({
    title: "", slug: "", excerpt: "", content: "", coverImage: "", author: "OneSoft Team", status: "draft", tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [postSlug, setPostSlug] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["cms-post", idStr],
    queryFn: async () => {
      // idStr could be a numeric id, need to find by id then get slug
      const allR = await fetch(`${BASE}/api/cms/posts?all=true`, { credentials: "include" });
      const all = await allR.json();
      return all.find((p: any) => p.id === Number(idStr));
    },
    enabled: !isNew && !!idStr,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title ?? "",
        slug: existing.slug ?? "",
        excerpt: existing.excerpt ?? "",
        content: existing.content ?? "",
        coverImage: existing.coverImage ?? "",
        author: existing.author ?? "OneSoft Team",
        status: existing.status ?? "draft",
        tags: existing.tags ?? [],
      });
      setSlugManual(true);
      setPostSlug(existing.slug);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (data: Post) => {
      const url = isNew ? `${BASE}/api/cms/posts` : `${BASE}/api/cms/posts/${idStr}`;
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
      queryClient.invalidateQueries({ queryKey: ["cms-posts"] });
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

  if (!isNew && isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/cms/posts")} className="-ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-xl font-bold">{isNew ? "New Post" : "Edit Post"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={form.status === "published" ? "default" : "secondary"} className="capitalize">{form.status}</Badge>
          <Button
            variant="outline" size="sm"
            onClick={() => setForm((f) => ({ ...f, status: f.status === "published" ? "draft" : "published" }))}
            className="gap-1.5"
          >
            {form.status === "published" ? <><EyeOff className="w-3.5 h-3.5" />Unpublish</> : <><Eye className="w-3.5 h-3.5" />Publish</>}
          </Button>
          <Button size="sm" className="gap-1.5" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <Label className="text-xs mb-1.5 block">Post Title *</Label>
            <Input
              placeholder="e.g. How to Achieve Band 8 in IELTS Reading"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-base font-medium"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Excerpt / Summary</Label>
            <Textarea
              placeholder="A short description shown on the blog listing page…"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Content (Markdown supported)</Label>
            <Textarea
              placeholder="Write your full post content here. Markdown is supported: **bold**, # Heading, - lists, etc."
              rows={20}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="resize-y font-mono text-sm"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Post Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">URL Slug *</Label>
                <Input
                  placeholder="my-post-title"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">/blog/{form.slug || "…"}</p>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Author</Label>
                <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Cover Image URL</Label>
                <Input
                  placeholder="https://…"
                  value={form.coverImage}
                  onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                />
                {form.coverImage && (
                  <img src={form.coverImage} alt="" className="mt-2 rounded-lg w-full h-32 object-cover bg-muted" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag…"
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
                      <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
