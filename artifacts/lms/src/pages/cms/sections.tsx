import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Save, ChevronDown, ChevronUp, Globe, RotateCcw, CheckCircle2, Info,
  Megaphone, User, Phone, Image, Layers, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

/* ── Section definitions ─────────────────────────────────────────── */

const SECTION_DEFS: Record<string, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  defaultContent: object;
  fields: { key: string; label: string; type: "text" | "textarea" | "url"; placeholder?: string }[];
}> = {
  portal_home: {
    label: "Portal Home Banner",
    description: "Welcome headline and subtitle shown at the top of your student portal home page.",
    icon: Home,
    iconColor: "text-indigo-600",
    defaultContent: {
      headline: "Welcome to Your IELTS Learning Portal",
      subheadline: "Access your lessons, quizzes, assignments, and track your progress towards your target band score.",
      ctaText: "Go to My Courses",
    },
    fields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Welcome to Your Learning Portal" },
      { key: "subheadline", label: "Subheadline", type: "textarea", placeholder: "Short description…" },
      { key: "ctaText", label: "CTA Button Text", type: "text", placeholder: "Go to My Courses" },
    ],
  },
  announcements: {
    label: "Pinned Announcement",
    description: "A banner notice displayed to all enrolled students on the portal.",
    icon: Megaphone,
    iconColor: "text-amber-600",
    defaultContent: {
      title: "",
      body: "",
      type: "info",
    },
    fields: [
      { key: "title", label: "Announcement Title", type: "text", placeholder: "e.g. Mock Test Schedule — June 2026" },
      { key: "body", label: "Announcement Body", type: "textarea", placeholder: "Write the announcement details here…" },
      { key: "type", label: "Type (info / warning / success)", type: "text", placeholder: "info" },
    ],
  },
  about: {
    label: "About the Academy",
    description: "A short 'About Us' paragraph shown on your public course listing page.",
    icon: Info,
    iconColor: "text-blue-600",
    defaultContent: {
      title: "About Our Academy",
      body: "We are a dedicated IELTS preparation academy committed to helping students achieve their target band scores.",
      founded: "",
      tagline: "",
    },
    fields: [
      { key: "title", label: "Section Title", type: "text", placeholder: "About Our Academy" },
      { key: "body", label: "About Text", type: "textarea", placeholder: "Describe your academy…" },
      { key: "founded", label: "Founded (e.g. 2018)", type: "text", placeholder: "2018" },
      { key: "tagline", label: "Tagline", type: "text", placeholder: "Your IELTS success, our mission." },
    ],
  },
  contact: {
    label: "Contact Details",
    description: "Phone, email, address and social links shown in your portal footer.",
    icon: Phone,
    iconColor: "text-emerald-600",
    defaultContent: {
      email: "",
      phone: "",
      address: "",
      whatsapp: "",
      facebook: "",
      instagram: "",
      youtube: "",
    },
    fields: [
      { key: "email", label: "Email Address", type: "text", placeholder: "contact@academy.com" },
      { key: "phone", label: "Phone / WhatsApp", type: "text", placeholder: "+1 555 000 0000" },
      { key: "address", label: "Address", type: "textarea", placeholder: "123 Main Street, City, Country" },
      { key: "whatsapp", label: "WhatsApp Link", type: "url", placeholder: "https://wa.me/…" },
      { key: "facebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/…" },
      { key: "instagram", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/…" },
      { key: "youtube", label: "YouTube Channel URL", type: "url", placeholder: "https://youtube.com/…" },
    ],
  },
  branding: {
    label: "Branding & Appearance",
    description: "Academy logo URL and portal colour accent used across the student portal.",
    icon: Image,
    iconColor: "text-violet-600",
    defaultContent: {
      logoUrl: "",
      accentColor: "#0d1b60",
      footerText: "",
    },
    fields: [
      { key: "logoUrl", label: "Logo Image URL", type: "url", placeholder: "https://…/logo.png" },
      { key: "accentColor", label: "Accent Colour (hex)", type: "text", placeholder: "#0d1b60" },
      { key: "footerText", label: "Footer Text", type: "text", placeholder: "© 2026 Academy Name. All rights reserved." },
    ],
  },
  courses_page: {
    label: "Courses Page Hero",
    description: "Headline and description shown at the top of your public course listing page.",
    icon: Layers,
    iconColor: "text-rose-600",
    defaultContent: {
      headline: "Explore Our IELTS Courses",
      subheadline: "Choose from our carefully designed courses to reach your band score goal.",
    },
    fields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Explore Our IELTS Courses" },
      { key: "subheadline", label: "Subheadline", type: "textarea", placeholder: "Short description…" },
    ],
  },
  instructor: {
    label: "Lead Instructor Profile",
    description: "Name, bio and credentials of your lead teacher shown on the courses page.",
    icon: User,
    iconColor: "text-cyan-600",
    defaultContent: {
      name: "",
      role: "",
      bio: "",
      avatarUrl: "",
      credentials: "",
    },
    fields: [
      { key: "name", label: "Instructor Name", type: "text", placeholder: "Dr. Jane Smith" },
      { key: "role", label: "Role / Credentials", type: "text", placeholder: "Ex-IELTS Examiner · CELTA Certified" },
      { key: "bio", label: "Short Bio", type: "textarea", placeholder: "A brief biography…" },
      { key: "avatarUrl", label: "Profile Photo URL", type: "url", placeholder: "https://…/photo.jpg" },
      { key: "credentials", label: "Notable Credentials (comma-separated)", type: "text", placeholder: "Cambridge CELTA, 10 years experience" },
    ],
  },
};

/* ── Section editor component ────────────────────────────────────── */

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

function SectionEditor({ sectionKey, def }: {
  sectionKey: string;
  def: typeof SECTION_DEFS[string];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
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
    def.fields.forEach((f) => { vals[f.key] = String(currentContent[f.key] ?? ""); });
    setFormValues(vals);
    setJsonText(JSON.stringify(currentContent, null, 2));
    setJsonError("");
    setOpen(true);
  };

  const handleSaveForm = () => {
    saveMutation.mutate(formValues);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText ?? "{}");
      setJsonError("");
      saveMutation.mutate(parsed);
    } catch {
      setJsonError("Invalid JSON — please fix errors before saving.");
    }
  };

  const handleResetToDefault = () => {
    const vals: Record<string, string> = {};
    def.fields.forEach((f) => { vals[f.key] = String((def.defaultContent as any)[f.key] ?? ""); });
    setFormValues(vals);
    setJsonText(JSON.stringify(def.defaultContent, null, 2));
    setJsonError("");
    setResetKey(k => k + 1);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => (open ? setOpen(false) : handleOpen())}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <def.icon className={`w-4 h-4 ${def.iconColor}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold">{def.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{def.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {existing ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Saved {format(new Date(existing.updatedAt), "MMM d, HH:mm")}
              </div>
            ) : (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Default</Badge>
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
                <TabsTrigger value="json" className="text-xs px-3 h-6">JSON</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost" size="sm"
              className="gap-1.5 text-xs h-7 text-muted-foreground"
              onClick={handleResetToDefault}
            >
              <RotateCcw className="w-3 h-3" />Reset to default
            </Button>
          </div>

          {editMode === "form" ? (
            <div className="space-y-4" key={resetKey}>
              {def.fields.map((field) => (
                <div key={field.key}>
                  <Label className="text-xs mb-1.5 block font-medium">{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      rows={3}
                      className="resize-y text-sm"
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      type={field.type === "url" ? "url" : "text"}
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="gap-1.5" disabled={saveMutation.isPending} onClick={handleSaveForm}>
                  <Save className="w-3.5 h-3.5" />
                  {saveMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                {existing && (
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive text-xs" onClick={() => resetMutation.mutate()}>
                    Remove Override
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Advanced: edit raw JSON content. Changes go live immediately on save.</p>
              <Textarea
                className="font-mono text-xs resize-y min-h-[240px] bg-muted/30"
                value={jsonText ?? ""}
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
          Customise your student portal's public-facing pages. Click a section to edit it.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 flex items-start gap-3">
        <Globe className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Live content editor</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Sections without saved content use built-in defaults. Save a section to override it.
            {savedCount > 0 && ` You have ${savedCount} customised section${savedCount !== 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(SECTION_DEFS).map(([key, def]) => (
            <SectionEditor key={key} sectionKey={key} def={def} />
          ))}
        </div>
      )}
    </div>
  );
}
