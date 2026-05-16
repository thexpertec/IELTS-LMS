import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Save, ChevronDown, ChevronUp, Globe, RotateCcw, CheckCircle2,
  Megaphone, User, Phone, Image, Layers, Home, Type, Star,
  ListOrdered, BarChart2, MousePointerClick, Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

/* ── Section definitions ─────────────────────────────────────────── */

type FieldType = "text" | "textarea" | "url" | "color" | "json";

type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
};

type SectionDef = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  tag?: string;
  defaultContent: object;
  fields: FieldDef[];
};

const SECTION_DEFS: Record<string, SectionDef> = {
  /* ── 1. Hero ─────────────────────────────────────────────────── */
  portal_home: {
    label: "Hero — Welcome Banner",
    description: "The floating card over the hero image: welcome text, headline, description and CTA button.",
    icon: Home,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
    tag: "Hero",
    defaultContent: {
      welcomeText: "",
      headline: "Start your future with IELTS",
      heroDescription: "Your personalised IELTS learning programme — everything you need to reach your target band score, in one portal.",
      ctaText: "Log in to Student Portal",
      heroImageUrl: "",
    },
    fields: [
      { key: "welcomeText", label: "Welcome Label (red text above headline)", type: "text", placeholder: "e.g. Welcome to Secure IELTS Academy" },
      { key: "headline", label: "Hero Headline (large text)", type: "text", placeholder: "Start your future with IELTS" },
      { key: "heroDescription", label: "Hero Description (paragraph)", type: "textarea", placeholder: "Your personalised IELTS learning programme…" },
      { key: "ctaText", label: "CTA Button Text", type: "text", placeholder: "Log in to Student Portal" },
      { key: "heroImageUrl", label: "Hero Background Image URL", type: "url", placeholder: "https://…/hero.jpg  (leave blank for default)" },
    ],
  },

  /* ── 2. Tagline Band ─────────────────────────────────────────── */
  tagline_band: {
    label: "Tagline Band",
    description: "The bold statement text shown in the white band directly below the hero.",
    icon: Type,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 dark:bg-sky-900/30",
    tag: "Below Hero",
    defaultContent: {
      text: "Dreaming of studying, living or working abroad? Your IELTS journey starts here — in a structured programme designed by your academy.",
    },
    fields: [
      { key: "text", label: "Tagline Text", type: "textarea", placeholder: "Dreaming of studying, living or working abroad?…" },
    ],
  },

  /* ── 3. IELTS Skills ─────────────────────────────────────────── */
  ielts_skills: {
    label: "IELTS Skills Section",
    description: "The four-card grid (Reading, Writing, Listening, Speaking) with customisable headings and descriptions.",
    icon: Layers,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50 dark:bg-violet-900/30",
    tag: "Skills",
    defaultContent: {
      sectionHeading: "All four IELTS skills in your programme",
      skills: [
        { title: "Academic Reading", desc: "Develop skills for every IELTS reading question type — matching headings, True/False/Not Given, sentence completion, and multiple choice.", imgUrl: "/lms/images/reading.jpg" },
        { title: "Academic Writing", desc: "Master Task 1 and Task 2 with structured writing exercises, vocabulary building, and detailed tutor feedback on every submission.", imgUrl: "/lms/images/writing.jpg" },
        { title: "Listening", desc: "Practise with authentic listening exercises using an integrated audio player and IELTS-format question panels including maps and forms.", imgUrl: "/lms/images/listening.jpg" },
        { title: "Speaking", desc: "Record your answers for Parts 1, 2 & 3 directly in the browser. Receive pinpoint audio feedback from your tutor on each response.", imgUrl: "/lms/images/speaking.jpg" },
      ],
    },
    fields: [
      { key: "sectionHeading", label: "Section Heading", type: "text", placeholder: "All four IELTS skills in your programme" },
      {
        key: "skills",
        label: "Skill Cards (JSON array)",
        type: "json",
        hint: 'Array of objects: [{"title":"…","desc":"…","imgUrl":"…"}, …]',
        placeholder: `[\n  {"title":"Academic Reading","desc":"…","imgUrl":"/lms/images/reading.jpg"},\n  …\n]`,
      },
    ],
  },

  /* ── 4. Portal Features ──────────────────────────────────────── */
  portal_features: {
    label: "Portal Features Section",
    description: "The grid of feature cards: 'What's inside your student portal'.",
    icon: Star,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    tag: "Features",
    defaultContent: {
      sectionHeading: "What's inside your student portal",
      features: [
        { title: "Quizzes & Mock Tests", desc: "Timed, IELTS-format quizzes with instant scoring. Review every answer in detail to understand your mistakes." },
        { title: "Structured Curriculum", desc: "Your academy organises lessons into courses and units — follow your personalised programme step by step." },
        { title: "Assignment Submissions", desc: "Submit writing and speaking tasks directly on the platform. Your tutor marks and returns feedback quickly." },
        { title: "Progress Dashboard", desc: "Your personal dashboard shows completion rates, quiz scores, and improvement trends across all four skills." },
        { title: "Message Your Tutor", desc: "Ask questions and get answers from your teacher directly inside the portal — no switching between apps." },
        { title: "Study with Classmates", desc: "Course announcements and discussion streams keep you connected with your cohort throughout the programme." },
      ],
    },
    fields: [
      { key: "sectionHeading", label: "Section Heading", type: "text", placeholder: "What's inside your student portal" },
      {
        key: "features",
        label: "Feature Cards (JSON array)",
        type: "json",
        hint: 'Array of objects: [{"title":"…","desc":"…"}, …]',
        placeholder: `[\n  {"title":"Quizzes & Mock Tests","desc":"…"},\n  …\n]`,
      },
    ],
  },

  /* ── 5. How It Works ─────────────────────────────────────────── */
  how_it_works: {
    label: "How It Works Section",
    description: "The numbered step-by-step guide explaining the student journey.",
    icon: ListOrdered,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    tag: "Steps",
    defaultContent: {
      sectionHeading: "How your programme works",
      steps: [
        { title: "Get enrolled", desc: "Your academy creates your account and enrols you into the right course for your current band level and target score." },
        { title: "Follow your programme", desc: "Work through reading passages, writing tasks, listening exercises and speaking labs — in the order your teacher designed." },
        { title: "Submit & get feedback", desc: "Complete assignments and quizzes, receive tutor feedback, and track your improvement week by week." },
        { title: "Achieve your band score", desc: "With a structured programme and consistent feedback, reach the IELTS band score you need — faster." },
      ],
    },
    fields: [
      { key: "sectionHeading", label: "Section Heading", type: "text", placeholder: "How your programme works" },
      {
        key: "steps",
        label: "Steps (JSON array)",
        type: "json",
        hint: 'Array of objects: [{"title":"…","desc":"…"}, …]',
        placeholder: `[\n  {"title":"Get enrolled","desc":"…"},\n  …\n]`,
      },
    ],
  },

  /* ── 6. Stats Band ───────────────────────────────────────────── */
  stats: {
    label: "Stats Band",
    description: "The navy statistics strip showing key academy metrics (band improvement, student count, etc.).",
    icon: BarChart2,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 dark:bg-rose-900/30",
    tag: "Stats",
    defaultContent: {
      stat1Val: "+1.5", stat1Label: "Average band improvement",
      stat2Val: "12K+", stat2Label: "Active students on the platform",
      stat3Val: "40+",  stat3Label: "IELTS academies onboarded",
      stat4Val: "98%",  stat4Label: "Academy satisfaction rate",
    },
    fields: [
      { key: "stat1Val",   label: "Stat 1 — Value",  type: "text", placeholder: "+1.5" },
      { key: "stat1Label", label: "Stat 1 — Label",  type: "text", placeholder: "Average band improvement" },
      { key: "stat2Val",   label: "Stat 2 — Value",  type: "text", placeholder: "12K+" },
      { key: "stat2Label", label: "Stat 2 — Label",  type: "text", placeholder: "Active students on the platform" },
      { key: "stat3Val",   label: "Stat 3 — Value",  type: "text", placeholder: "40+" },
      { key: "stat3Label", label: "Stat 3 — Label",  type: "text", placeholder: "IELTS academies onboarded" },
      { key: "stat4Val",   label: "Stat 4 — Value",  type: "text", placeholder: "98%" },
      { key: "stat4Label", label: "Stat 4 — Label",  type: "text", placeholder: "Academy satisfaction rate" },
    ],
  },

  /* ── 7. CTA Section ──────────────────────────────────────────── */
  cta_section: {
    label: "Call-to-Action Section",
    description: "The bottom CTA block with a heading, description and login buttons.",
    icon: MousePointerClick,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50 dark:bg-cyan-900/30",
    tag: "CTA",
    defaultContent: {
      heading: "Ready to start your IELTS programme?",
      description: "Log in with the credentials your academy has provided and begin your personalised learning programme today.",
      studentCtaText: "Log in to Student Portal",
      adminCtaText: "Admin Login",
    },
    fields: [
      { key: "heading",        label: "CTA Heading",          type: "text",     placeholder: "Ready to start your IELTS programme?" },
      { key: "description",    label: "CTA Description",      type: "textarea", placeholder: "Log in with the credentials your academy…" },
      { key: "studentCtaText", label: "Student Button Text",  type: "text",     placeholder: "Log in to Student Portal" },
      { key: "adminCtaText",   label: "Admin Button Text",    type: "text",     placeholder: "Admin Login" },
    ],
  },

  /* ── 8. Branding & Footer ────────────────────────────────────── */
  branding: {
    label: "Branding & Footer",
    description: "Logo URL and the footer copyright / powered-by text.",
    icon: Image,
    iconColor: "text-fuchsia-600",
    iconBg: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    tag: "Global",
    defaultContent: {
      logoUrl: "",
      footerText: "",
    },
    fields: [
      { key: "logoUrl",    label: "Logo Image URL",   type: "url",  placeholder: "https://…/logo.png" },
      { key: "footerText", label: "Footer Text",      type: "text", placeholder: "© 2026 Academy Name. All rights reserved." },
    ],
  },

  /* ── 9. Contact ──────────────────────────────────────────────── */
  contact: {
    label: "Contact Details",
    description: "Email, phone and social links shown in footer and CTA contact line.",
    icon: Phone,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    tag: "Global",
    defaultContent: {
      email: "", phone: "", address: "",
      whatsapp: "", facebook: "", instagram: "", youtube: "",
    },
    fields: [
      { key: "email",     label: "Email Address",       type: "text", placeholder: "contact@academy.com" },
      { key: "phone",     label: "Phone / WhatsApp",    type: "text", placeholder: "+1 555 000 0000" },
      { key: "address",   label: "Address",             type: "textarea", placeholder: "123 Main Street, City" },
      { key: "whatsapp",  label: "WhatsApp Link",       type: "url",  placeholder: "https://wa.me/…" },
      { key: "facebook",  label: "Facebook URL",        type: "url",  placeholder: "https://facebook.com/…" },
      { key: "instagram", label: "Instagram URL",       type: "url",  placeholder: "https://instagram.com/…" },
      { key: "youtube",   label: "YouTube Channel URL", type: "url",  placeholder: "https://youtube.com/…" },
    ],
  },

  /* ── 10. Announcements Banner ────────────────────────────────── */
  announcements: {
    label: "Pinned Announcement Banner",
    description: "A notice banner shown to visitors at the top of the portal.",
    icon: Megaphone,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    tag: "Global",
    defaultContent: { title: "", body: "", type: "info" },
    fields: [
      { key: "title", label: "Announcement Title", type: "text",     placeholder: "e.g. Mock Test Schedule — June 2026" },
      { key: "body",  label: "Announcement Body",  type: "textarea", placeholder: "Write the announcement details here…" },
      { key: "type",  label: "Type (info / warning / success)", type: "text", placeholder: "info" },
    ],
  },

  /* ── 11. About the Academy ───────────────────────────────────── */
  about: {
    label: "About the Academy",
    description: "Short 'About Us' text shown on the public course listing page.",
    icon: Layout,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    tag: "Courses Page",
    defaultContent: { title: "About Our Academy", body: "", founded: "", tagline: "" },
    fields: [
      { key: "title",   label: "Section Title",  type: "text",     placeholder: "About Our Academy" },
      { key: "body",    label: "About Text",     type: "textarea", placeholder: "Describe your academy…" },
      { key: "founded", label: "Founded Year",   type: "text",     placeholder: "2018" },
      { key: "tagline", label: "Tagline",        type: "text",     placeholder: "Your IELTS success, our mission." },
    ],
  },
};

/* ── Helpers ─────────────────────────────────────────────────────── */

type Section = { id: number; sectionKey: string; label: string | null; content: Record<string, unknown>; updatedAt: string };

async function fetchSections(): Promise<Section[]> {
  const r = await fetch("/api/tenant-cms/sections", { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
}
async function saveSection(key: string, content: object, label: string) {
  const r = await fetch(`/api/tenant-cms/sections/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content, label }),
  });
  if (!r.ok) throw new Error("Failed to save");
  return r.json();
}
async function deleteSection(key: string) {
  await fetch(`/api/tenant-cms/sections/${key}`, { method: "DELETE", credentials: "include" });
}

/* ── Section accordion editor ────────────────────────────────────── */

function SectionEditor({ sectionKey, def }: { sectionKey: string; def: SectionDef }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState<"form" | "json">("form");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const { data: sections } = useQuery({ queryKey: ["tenant-cms-sections"], queryFn: fetchSections });
  const existing = sections?.find((s) => s.sectionKey.endsWith(`_${sectionKey}`));
  const currentContent = (existing?.content ?? def.defaultContent) as Record<string, unknown>;

  const saveMutation = useMutation({
    mutationFn: (content: object) => saveSection(sectionKey, content, def.label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-cms-sections"] });
      toast({ title: `${def.label} saved` });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: () => deleteSection(sectionKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-cms-sections"] });
      toast({ title: `${def.label} reset to default` });
    },
  });

  const handleOpen = () => {
    const vals: Record<string, string> = {};
    def.fields.forEach((f) => {
      const v = currentContent[f.key];
      vals[f.key] = f.type === "json" ? JSON.stringify(v ?? (def.defaultContent as any)[f.key] ?? [], null, 2) : String(v ?? "");
    });
    setFormValues(vals);
    setJsonText(JSON.stringify(currentContent, null, 2));
    setJsonError("");
    setOpen(true);
  };

  const handleSaveForm = () => {
    const result: Record<string, unknown> = {};
    def.fields.forEach((f) => {
      if (f.type === "json") {
        try { result[f.key] = JSON.parse(formValues[f.key] ?? "[]"); }
        catch { result[f.key] = formValues[f.key]; }
      } else {
        result[f.key] = formValues[f.key] ?? "";
      }
    });
    saveMutation.mutate(result);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError("");
      saveMutation.mutate(parsed);
    } catch {
      setJsonError("Invalid JSON — please fix errors before saving.");
    }
  };

  const handleResetToDefault = () => {
    const vals: Record<string, string> = {};
    def.fields.forEach((f) => {
      const v = (def.defaultContent as any)[f.key];
      vals[f.key] = f.type === "json" ? JSON.stringify(v ?? [], null, 2) : String(v ?? "");
    });
    setFormValues(vals);
    setJsonText(JSON.stringify(def.defaultContent, null, 2));
    setJsonError("");
    setResetKey((k) => k + 1);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-4 cursor-pointer hover:bg-muted/30 transition-colors select-none"
        onClick={() => (open ? setOpen(false) : handleOpen())}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${def.iconBg} flex items-center justify-center flex-shrink-0`}>
              <def.icon className={`w-4 h-4 ${def.iconColor}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-semibold">{def.label}</CardTitle>
                {def.tag && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex">
                    {def.tag}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{def.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {existing ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Saved {format(new Date(existing.updatedAt), "MMM d, HH:mm")}
              </div>
            ) : (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex text-muted-foreground">Default</Badge>
            )}
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Tabs value={editMode} onValueChange={(v) => setEditMode(v as "form" | "json")}>
              <TabsList className="h-7">
                <TabsTrigger value="form" className="text-xs px-3 h-6">Form</TabsTrigger>
                <TabsTrigger value="json" className="text-xs px-3 h-6">Raw JSON</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost" size="sm"
              className="gap-1.5 text-xs h-7 text-muted-foreground"
              onClick={handleResetToDefault}
            >
              <RotateCcw className="w-3 h-3" /> Reset defaults
            </Button>
          </div>

          {editMode === "form" ? (
            <div className="space-y-4" key={resetKey}>
              {def.fields.map((field) => (
                <div key={field.key}>
                  <Label className="text-xs mb-1 block font-medium">{field.label}</Label>
                  {field.hint && (
                    <p className="text-[10px] text-muted-foreground mb-1.5">{field.hint}</p>
                  )}
                  {field.type === "json" ? (
                    <Textarea
                      rows={8}
                      className="resize-y font-mono text-xs bg-muted/30"
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    />
                  ) : field.type === "textarea" ? (
                    <Textarea
                      rows={3}
                      className="resize-y text-sm"
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      type={field.type === "url" ? "url" : field.type === "color" ? "color" : "text"}
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1 flex-wrap">
                <Button size="sm" className="gap-1.5" disabled={saveMutation.isPending} onClick={handleSaveForm}>
                  <Save className="w-3.5 h-3.5" />
                  {saveMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                {existing && (
                  <Button
                    size="sm" variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive text-xs"
                    onClick={() => resetMutation.mutate()}
                  >
                    Remove Override
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Edit the full section content as raw JSON. This replaces all fields at once.</p>
              <Textarea
                className="font-mono text-xs resize-y min-h-[260px] bg-muted/30"
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setJsonError(""); }}
              />
              {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5" disabled={saveMutation.isPending} onClick={handleSaveJson}>
                  <Save className="w-3.5 h-3.5" />
                  {saveMutation.isPending ? "Saving…" : "Save JSON"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

const SECTION_ORDER = [
  "portal_home",
  "tagline_band",
  "ielts_skills",
  "portal_features",
  "how_it_works",
  "stats",
  "cta_section",
  "branding",
  "contact",
  "announcements",
  "about",
];

export default function CmsSections() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["tenant-cms-sections"],
    queryFn: fetchSections,
  });
  const savedCount = (sections ?? []).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portal Page Sections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customise every section of your public-facing portal homepage. Click a section to edit it.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 flex items-start gap-3">
        <Globe className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Live content — shown to all visitors</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Sections without a saved override use built-in defaults. Save any section to customise it.
            {savedCount > 0 && ` You have ${savedCount} customised section${savedCount !== 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {SECTION_ORDER.map((key) => {
            const def = SECTION_DEFS[key];
            if (!def) return null;
            return <SectionEditor key={key} sectionKey={key} def={def} />;
          })}
        </div>
      )}
    </div>
  );
}
