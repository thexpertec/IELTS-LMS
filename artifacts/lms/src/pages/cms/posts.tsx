import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Tag, Search, FileText,
  Megaphone, Globe, Clock, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Post = {
  id: number; title: string; slug: string; excerpt: string | null;
  author: string; status: string; tags: string[]; publishedAt: string | null;
  createdAt: string; updatedAt: string; coverImage: string | null;
};

async function fetchPosts(): Promise<Post[]> {
  const r = await fetch("/api/tenant-cms/posts", { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load posts");
  return r.json();
}
async function deletePost(id: number) {
  const r = await fetch(`/api/tenant-cms/posts/${id}`, { method: "DELETE", credentials: "include" });
  if (!r.ok) throw new Error("Failed to delete");
}
async function toggleStatus(id: number, status: string) {
  const r = await fetch(`/api/tenant-cms/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: status === "published" ? "draft" : "published" }),
  });
  if (!r.ok) throw new Error("Failed to update");
  return r.json();
}

export default function CmsPosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["tenant-cms-posts"],
    queryFn: fetchPosts,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-cms-posts"] });
      toast({ title: "Post deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => toggleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-cms-posts"] });
    },
  });

  const filtered = (posts ?? []).filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const publishedCount = (posts ?? []).filter((p) => p.status === "published").length;
  const draftCount = (posts ?? []).filter((p) => p.status === "draft").length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog & Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage posts shown to students on your portal.
          </p>
        </div>
        <Button asChild>
          <Link href="/cms/posts/new">
            <Plus className="w-4 h-4 mr-1.5" />New Post
          </Link>
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: `All (${(posts ?? []).length})`, value: "all" },
          { label: `Published (${publishedCount})`, value: "published" },
          { label: `Drafts (${draftCount})`, value: "draft" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-16 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-base mb-1">
              {search || statusFilter !== "all" ? "No posts match your filters" : "No posts yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "Try clearing the search or filter."
                : "Create your first blog post or announcement to get started."}
            </p>
            {!search && statusFilter === "all" && (
              <Button asChild>
                <Link href="/cms/posts/new">
                  <Plus className="w-4 h-4 mr-1.5" />Write First Post
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card key={post.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="p-4 flex items-start gap-4">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/8 transition-colors">
                    <FileText className="w-6 h-6 text-primary/40" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm">{post.title}</p>
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className="text-xs capitalize"
                    >
                      {post.status === "published"
                        ? <><Globe className="w-2.5 h-2.5 mr-1" />Published</>
                        : <><FileText className="w-2.5 h-2.5 mr-1" />Draft</>}
                    </Badge>
                    {(post.tags ?? []).slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs gap-1 hidden sm:inline-flex">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </Badge>
                    ))}
                  </div>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </span>
                    <span>By {post.author}</span>
                    {post.publishedAt && (
                      <span className="text-emerald-600">
                        Published {format(new Date(post.publishedAt), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={post.status === "published" ? "Unpublish" : "Publish"}
                    onClick={() => toggleMutation.mutate({ id: post.id, status: post.status })}
                  >
                    {post.status === "published"
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/cms/posts/${post.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete "{post.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(post.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
