import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileText, Globe, PenTool, Eye, ArrowRight, CheckCircle2, Clock,
  Megaphone, LayoutTemplate, Newspaper, TrendingUp, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Post = { id: number; title: string; status: string; createdAt: string; author: string };
type Section = { id: number; sectionKey: string; label: string | null; updatedAt: string };

async function fetchPosts(): Promise<Post[]> {
  const r = await fetch("/api/tenant-cms/posts", { credentials: "include" });
  return r.ok ? r.json() : [];
}
async function fetchSections(): Promise<Section[]> {
  const r = await fetch("/api/tenant-cms/sections", { credentials: "include" });
  return r.ok ? r.json() : [];
}

export default function CmsIndex() {
  const { data: posts, isLoading: postsLoading } = useQuery({ queryKey: ["tenant-cms-posts"], queryFn: fetchPosts });
  const { data: sections, isLoading: sectionsLoading } = useQuery({ queryKey: ["tenant-cms-sections"], queryFn: fetchSections });

  const published = (posts ?? []).filter((p) => p.status === "published").length;
  const drafts = (posts ?? []).filter((p) => p.status === "draft").length;
  const savedSections = (sections ?? []).length;

  const stats = [
    { label: "Published Posts", value: postsLoading ? "—" : published, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Draft Posts", value: postsLoading ? "—" : drafts, icon: FileText, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amberald-950/30" },
    { label: "Page Sections", value: sectionsLoading ? "—" : savedSections, icon: LayoutTemplate, color: "text-primary", bg: "bg-primary/5" },
    { label: "Total Posts", value: postsLoading ? "—" : (posts ?? []).length, icon: Newspaper, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your portal's pages, announcements, and blog posts.
          </p>
        </div>
        <Button asChild>
          <Link href="/cms/posts/new">
            <Plus className="w-4 h-4 mr-1.5" />New Post
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick access cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            href: "/cms/sections",
            icon: LayoutTemplate,
            iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
            iconColor: "text-indigo-600 dark:text-indigo-400",
            title: "Portal Page Sections",
            desc: "Customise hero banners, announcements, about section, and contact details.",
          },
          {
            href: "/cms/posts",
            icon: Newspaper,
            iconBg: "bg-violet-100 dark:bg-violet-900/40",
            iconColor: "text-violet-600 dark:text-violet-400",
            title: "Blog & Announcements",
            desc: "Create and manage articles, news, and announcements for students.",
          },
          {
            href: "/cms/posts/new",
            icon: PenTool,
            iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            title: "Write New Post",
            desc: "Draft a new blog post or student announcement with Markdown support.",
          },
        ].map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="group border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column: sections + recent posts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Portal sections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm">Portal Page Sections</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Customised sections of your portal.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cms/sections"><ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {sectionsLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : savedSections === 0 ? (
              <div className="text-center py-8">
                <LayoutTemplate className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No custom sections yet — defaults in use.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/cms/sections">Customise Sections</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(sections ?? []).slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="font-medium truncate">{s.label ?? s.sectionKey}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(s.updatedAt), "MMM d")}
                    </span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-1 text-primary" asChild>
                  <Link href="/cms/sections">Edit all sections →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm">Recent Posts</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Blog posts and student announcements.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cms/posts"><ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (posts ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No posts yet.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/cms/posts/new">Write First Post</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(posts ?? []).slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className="text-xs flex-shrink-0 capitalize"
                    >
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

      {/* Tips banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 dark:bg-indigo-950/20 dark:border-indigo-900/40 p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-200">Tip: Keep your portal fresh</p>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
            Regular announcements and updated page sections keep students engaged. Aim for at least one post per week
            and review your portal sections monthly to keep information current.
          </p>
        </div>
      </div>
    </div>
  );
}
