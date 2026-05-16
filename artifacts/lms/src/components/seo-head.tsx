import { useEffect } from "react";

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export function SeoHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  canonicalUrl,
  noIndex = false,
  structuredData,
}: SeoHeadProps) {
  useEffect(() => {
    if (title) document.title = title;

    function setMeta(name: string, content: string, prop = false) {
      if (!content) return;
      const attr = prop ? "property" : "name";
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    function setLink(rel: string, href: string) {
      if (!href) return;
      let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    }

    function setScript(id: string, content: string) {
      let el = document.head.querySelector(`script#${id}`) as HTMLScriptElement | null;
      if (!el) {
        el = document.createElement("script");
        el.id = id;
        el.type = "application/ld+json";
        document.head.appendChild(el);
      }
      el.textContent = content;
    }

    if (description)    setMeta("description",          description);
    if (keywords)       setMeta("keywords",             keywords);
    if (noIndex)        setMeta("robots",               "noindex, nofollow");
    else                setMeta("robots",               "index, follow");

    setMeta("og:type",        ogType,                            true);
    if (ogTitle || title)     setMeta("og:title",       ogTitle || title || "",  true);
    if (ogDescription || description) setMeta("og:description", ogDescription || description || "", true);
    if (ogImage)              setMeta("og:image",       ogImage,                 true);
    if (canonicalUrl)         setMeta("og:url",         canonicalUrl,            true);

    setMeta("twitter:card",        twitterCard);
    if (ogTitle || title)          setMeta("twitter:title",       ogTitle || title || "");
    if (ogDescription || description) setMeta("twitter:description", ogDescription || description || "");
    if (ogImage)                   setMeta("twitter:image",       ogImage);

    if (canonicalUrl)   setLink("canonical", canonicalUrl);

    if (structuredData) setScript("structured-data", JSON.stringify(structuredData));
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, twitterCard, canonicalUrl, noIndex, structuredData]);

  return null;
}
