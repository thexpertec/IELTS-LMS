import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Globe, PenTool, Eye, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Post = { id: number; title: string; status: string; createdAt: string; author: string };
type Section = { id: number; sectionKey: string; label: string | null; updatedAt: string };

async function fetchPosts(): Promise<Post[]> {
  const r = await fetch(`/api/cms/posts?all=true`, { credentials: "include" });
  return r.ok ? r.json() : [];
}
async function fetchSections(): Promise<Section[]> {
  const r = await fetch(`/api/cms/sections`, { credentials: "include" });
  return r.ok ? r.json() : [];
}

export default function CmsIndex() {
  const { data: posts, isLoading: postsLoading } = useQuery({ queryKey: ["cms-posts"], queryFn: fetchPosts });
  const { data: sections, isLoading: sectionsLoading } = useQuery({ queryKey: ["cms-sections"], queryFn: fetchSections });

  const published = (posts ?? []).filter((p) => p.status === "published").length;
  const drafts = (posts ?? []).filter((p) => p.status === "draft").length;
  const savedSections = (sections ?? []).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your website content, blog posts, and landing page sections.</p>
        </div>
        <Button asChild>
          <a href="/" target="_blank" rel="noopener noreferrer" className="gap-2">
            <Eye className="w-4 h-4" />View Website
          </a>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Published Posts", value: postsLoading ? "—" : published, icon: Globe, color: "text-emerald-600" },
          { label: "Drafts", value: postsLoading ? "—" : drafts, icon: FileText, color: "text-amber-500" },
          { label: "Page Sections Saved", value: sectionsLoading ? "—" : savedSections, icon: CheckCircle2, color: "text-primary" },
          { label: "Total Posts", value: postsLoading ? "—" : (posts ?? []).length, icon: PenTool, color: "text-violet-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Landing page sections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Landing Page Sections</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Edit hero, features, pricing, FAQ and more.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cms/sections"><ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {sectionsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : savedSections === 0 ? (
              <div className="text-center py-6">
                <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No custom sections yet — defaults are in use.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/cms/sections">Edit Sections</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(sections ?? []).slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-medium">{s.label ?? s.sectionKey}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(s.updatedAt), "MMM d")}</span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-2 text-primary" asChild>
                  <Link href="/cms/sections">Edit all sections →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Recent Blog Posts</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Articles published on the website.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cms/posts"><ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (posts ?? []).length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No posts yet.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/cms/posts/new">Write First Post</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(posts ?? []).slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs flex-shrink-0 capitalize">
                      {post.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-1 text-primary" asChild>
                  <Link href="/cms/posts">Manage all posts →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
