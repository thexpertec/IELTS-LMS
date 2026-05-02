import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, Eye, EyeOff, Tag, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Post = {
  id: number; title: string; slug: string; excerpt: string | null;
  author: string; status: string; tags: string[]; publishedAt: string | null;
  createdAt: string; updatedAt: string; coverImage: string | null;
};

async function fetchPosts(): Promise<Post[]> {
  const r = await fetch(`/api/cms/posts?all=true`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load posts");
  return r.json();
}

async function deletePost(id: number) {
  const r = await fetch(`/api/cms/posts/${id}`, { method: "DELETE", credentials: "include" });
  if (!r.ok) throw new Error("Failed to delete");
}

async function toggleStatus(id: number, status: string) {
  const r = await fetch(`/api/cms/posts/${id}`, {
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

  const { data: posts, isLoading } = useQuery({ queryKey: ["cms-posts"], queryFn: fetchPosts });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cms-posts"] }); toast({ title: "Post deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => toggleStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cms-posts"] }); },
  });

  const filtered = (posts ?? []).filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage articles shown on the website.</p>
        </div>
        <Button asChild>
          <Link href="/cms/posts/new"><Plus className="w-4 h-4 mr-2" />New Post</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search posts…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm text-muted-foreground">Create your first blog post to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card key={post.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-start gap-4">
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-muted" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm">{post.title}</p>
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs capitalize">
                      {post.status}
                    </Badge>
                    {(post.tags ?? []).slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs gap-1">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </Badge>
                    ))}
                  </div>
                  {post.excerpt && <p className="text-xs text-muted-foreground truncate mb-1">{post.excerpt}</p>}
                  <p className="text-xs text-muted-foreground">
                    By {post.author} · {format(new Date(post.createdAt), "MMM d, yyyy")}
                    {post.publishedAt && ` · Published ${format(new Date(post.publishedAt), "MMM d")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title={post.status === "published" ? "Unpublish" : "Publish"}
                    onClick={() => toggleMutation.mutate({ id: post.id, status: post.status })}
                  >
                    {post.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/cms/posts/${post.id}`}><Edit2 className="w-4 h-4" /></Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>Delete "{post.title}"? This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(post.id)}>
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
