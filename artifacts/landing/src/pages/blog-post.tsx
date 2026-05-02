import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { format } from "date-fns";
import { ArrowLeft, Tag, Calendar, User, Share2, FileText } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Post = {
  id: number; title: string; slug: string; excerpt: string | null;
  content: string; author: string; tags: string[];
  publishedAt: string | null; createdAt: string; coverImage: string | null; status: string;
};

async function fetchPost(slug: string): Promise<Post> {
  const r = await fetch(`${BASE}/api/cms/posts/${slug}`);
  if (!r.ok) throw new Error("Not found");
  return r.json();
}

/* Simple markdown-to-HTML renderer */
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^\> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|b|l|a])/gm, "")
    .replace(/^(?!<)/gm, "<p>")
    .replace(/<\/p><p>/g, "</p>\n<p>")
    || md;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["public-post", slug],
    queryFn: () => fetchPost(slug!),
    enabled: !!slug,
  });

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="animate-pulse space-y-5">
              <div className="h-8 bg-gray-100 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="aspect-video bg-gray-100 rounded-2xl" />
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post || post.status !== "published") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Article not found</h1>
            <p className="text-muted-foreground mb-6">This article may have been removed or is not published yet.</p>
            <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <article className="flex-1 pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>

          {/* Tags */}
          {(post.tags ?? []).length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {(post.tags ?? []).map((t) => (
                <Link
                  key={t}
                  href={`/blog?tag=${t}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/8 px-2.5 py-1 rounded-full hover:bg-primary/15 transition-colors"
                >
                  <Tag className="w-2.5 h-2.5" />{t}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium text-gray-700">{post.author}</span>
            </div>
            {post.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(post.publishedAt), "MMMM d, yyyy")}</span>
              </div>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-10 shadow-sm">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-primary/40 pl-5 mb-8 italic">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-gray prose-lg max-w-none
              prose-headings:font-extrabold prose-headings:tracking-tight
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-blockquote:border-primary/50 prose-blockquote:not-italic prose-blockquote:text-gray-600
              prose-li:marker:text-primary"
            dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(post.content)}</p>` }}
          />

          {/* Footer CTA */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-violet-50 border border-primary/10 text-center">
            <p className="text-sm font-semibold text-primary mb-1">Ready to transform your IELTS academy?</p>
            <h3 className="text-xl font-extrabold text-gray-900 mb-4">Start your free 14-day trial</h3>
            <a
              href="/lms/"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
            >
              Get Started Free →
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
