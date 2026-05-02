import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { format } from "date-fns";
import { ArrowRight, Tag, Search, FileText } from "lucide-react";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Post = {
  id: number; title: string; slug: string; excerpt: string | null;
  author: string; tags: string[]; publishedAt: string | null;
  createdAt: string; coverImage: string | null;
};

async function fetchPosts(): Promise<Post[]> {
  const r = await fetch(`${BASE}/api/cms/posts`);
  if (!r.ok) return [];
  return r.json();
}

export default function BlogPage() {
  const { data: posts, isLoading } = useQuery({ queryKey: ["public-posts"], queryFn: fetchPosts });
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(new Set((posts ?? []).flatMap((p) => p.tags ?? [])));

  const filtered = (posts ?? []).filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || (p.tags ?? []).includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#f5f3ff] to-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-primary/15">
            <FileText className="w-3.5 h-3.5" /> Blog & Resources
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            IELTS Academy Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practical guides, teaching strategies, and platform updates for IELTS academy directors and tutors.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Tags */}
      {allTags.length > 0 && (
        <section className="border-b border-gray-100">
          <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !activeTag ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTag === tag ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Tag className="w-2.5 h-2.5" />{tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      <section className="flex-1 py-16">
        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-72" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No articles found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || activeTag ? "Try a different search or tag." : "Check back soon — we publish new articles weekly."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <article key={post.id} className="group rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  {post.coverImage ? (
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/8 to-violet-50 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-primary/20" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    {(post.tags ?? []).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {(post.tags ?? []).slice(0, 2).map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="font-bold text-gray-900 leading-snug mb-2 text-[1.05rem] group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-gray-700">{post.author}</span>
                        {post.publishedAt && <> · {format(new Date(post.publishedAt), "MMM d, yyyy")}</>}
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-2 transition-all"
                      >
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
