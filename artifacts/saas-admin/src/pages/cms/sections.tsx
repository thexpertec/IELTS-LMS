import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, ChevronUp, Globe, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Default content for each editable section */
const DEFAULTS: Record<string, { label: string; description: string; defaultContent: object }> = {
  hero: {
    label: "Hero Section",
    description: "Main headline, subtitle, and CTA buttons shown at the top of the page.",
    defaultContent: {
      badge: "The LMS built for IELTS Academies",
      headline: "Run your entire IELTS academy on one platform.",
      subheadline: "Curriculum builder, IELTS-native quizzes, assignment grading, gradebook, student portal, and real-time analytics — everything your academy needs to deliver outstanding band scores, without the admin chaos.",
      primaryCta: "Start Free Trial",
      secondaryCta: "See All Features",
      disclaimer: "Free 14-day trial · No credit card required · Setup in under 48 hours",
    },
  },
  stats: {
    label: "Statistics Strip",
    description: "Key numbers shown below the hero section.",
    defaultContent: {
      items: [
        { value: "40+", label: "IELTS academies onboarded" },
        { value: "12K+", label: "Active students worldwide" },
        { value: "+1.5", label: "Average band improvement" },
        { value: "98%", label: "Academy satisfaction rate" },
      ],
    },
  },
  testimonials: {
    label: "Testimonials",
    description: "Quotes from academy directors shown on the website.",
    defaultContent: {
      items: [
        { quote: "We replaced three separate tools with OneSoft. Our teachers now spend time teaching — not managing spreadsheets.", author: "Priya Mehta", role: "Director, Excel IELTS Academy — Dubai" },
        { quote: "The quiz builder alone was worth switching. We created 200+ questions in one afternoon.", author: "James Thornton", role: "Head Tutor, BritPrep Language School — London" },
        { quote: "Our band score improvement jumped after we moved to OneSoft.", author: "Min-Ji Park", role: "Founder, Seoul Band 7 Academy" },
      ],
    },
  },
  faq: {
    label: "FAQ Section",
    description: "Frequently asked questions shown on the landing page.",
    defaultContent: {
      items: [
        { q: "How long does it take to set up our academy on OneSoft?", a: "Most academies are fully live within 48 hours." },
        { q: "Can multiple teachers manage different classes?", a: "Yes. You can create unlimited teacher accounts on the Academy and Enterprise plans." },
        { q: "Does it support computer-delivered IELTS formatting?", a: "Absolutely. Our interfaces replicate the computer-delivered IELTS experience." },
        { q: "Is there a free trial?", a: "Every plan includes a free 14-day trial with full access. No credit card required." },
      ],
    },
  },
  pricing: {
    label: "Pricing Plans",
    description: "Pricing plan names, prices, and feature lists.",
    defaultContent: {
      plans: [
        { name: "Starter", price: "99", period: "/month", desc: "For small academies or independent tutors.", features: ["Up to 50 active students", "5 teacher accounts", "Full curriculum builder"] },
        { name: "Academy", price: "249", period: "/month", desc: "The complete platform for growing academies.", features: ["Up to 300 active students", "Unlimited teacher accounts", "Advanced gradebook & analytics"] },
        { name: "Enterprise", price: "Custom", period: "", desc: "For multi-branch institutes.", features: ["Unlimited students", "Custom branding & domain", "Dedicated CSM"] },
      ],
    },
  },
  site_settings: {
    label: "Site Settings",
    description: "Company name, contact email, social links, and footer text.",
    defaultContent: {
      companyName: "OneSoft LMS",
      tagline: "The LMS built for IELTS Academies",
      contactEmail: "contact@onesoftlms.com",
      phone: "+1 (555) 123-4567",
      address: "San Francisco, CA",
      twitter: "",
      linkedin: "",
      youtube: "",
    },
  },
};

type Section = {
  id: number; sectionKey: string; label: string | null;
  content: object; updatedAt: string;
};

async function fetchSections(): Promise<Section[]> {
  const r = await fetch(`${BASE}/api/cms/sections`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
}

async function saveSection(key: string, content: object, label: string) {
  const r = await fetch(`${BASE}/api/cms/sections/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content, label }),
  });
  if (!r.ok) throw new Error("Failed to save");
  return r.json();
}

function SectionEditor({ sectionKey, meta }: { sectionKey: string; meta: typeof DEFAULTS[string] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState("");

  const { data: sections } = useQuery({ queryKey: ["cms-sections"], queryFn: fetchSections });
  const existing = sections?.find((s) => s.sectionKey === sectionKey);
  const currentContent = existing?.content ?? meta.defaultContent;

  const saveMutation = useMutation({
    mutationFn: (content: object) => saveSection(sectionKey, content, meta.label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-sections"] });
      toast({ title: `${meta.label} saved` });
      setOpen(false);
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const handleOpen = () => {
    setJsonText(JSON.stringify(currentContent, null, 2));
    setJsonError("");
    setOpen(true);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText ?? "{}");
      setJsonError("");
      saveMutation.mutate(parsed);
    } catch {
      setJsonError("Invalid JSON — please fix errors before saving.");
    }
  };

  const handleReset = () => {
    setJsonText(JSON.stringify(meta.defaultContent, null, 2));
    setJsonError("");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => (open ? setOpen(false) : handleOpen())}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{meta.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {existing && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Saved {format(new Date(existing.updatedAt), "MMM d, HH:mm")}
              </div>
            )}
            {!existing && <Badge variant="outline" className="text-xs">Using default</Badge>}
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Edit the JSON content below. The landing page reads this data directly.</p>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground" onClick={handleReset}>
              <RotateCcw className="w-3 h-3" />Reset to default
            </Button>
          </div>
          <Textarea
            className="font-mono text-xs resize-y min-h-[280px] bg-muted/30"
            value={jsonText ?? ""}
            onChange={(e) => { setJsonText(e.target.value); setJsonError(""); }}
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" disabled={saveMutation.isPending} onClick={handleSave}>
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function CmsSections() {
  const { data: sections, isLoading } = useQuery({ queryKey: ["cms-sections"], queryFn: fetchSections });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Landing Page Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit each section of the public website. Changes go live immediately.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <Globe className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Live content editor</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Sections without saved content fall back to the built-in defaults. Save a section to override it with your custom content.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(DEFAULTS).map(([key, meta]) => (
            <SectionEditor key={key} sectionKey={key} meta={meta} />
          ))}
        </div>
      )}
    </div>
  );
}
