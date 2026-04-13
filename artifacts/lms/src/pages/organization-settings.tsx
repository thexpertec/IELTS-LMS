import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Palette,
  Sliders,
  Globe,
  Shield,
  Save,
  Loader2,
  Crown,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Image,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface TenantFeatures {
  selfRegistration: boolean;
  discussions: boolean;
  quizRetakes: boolean;
  emailNotifications: boolean;
  certificates: boolean;
  maintenanceMode: boolean;
  showStudentProgress: boolean;
  allowFileUploads: boolean;
}

interface TenantPortal {
  welcomeMessage: string;
  supportEmail: string;
  timezone: string;
  defaultLanguage: string;
}

interface TenantBranding {
  tagline: string;
  accentColor: string;
}

interface OrgSettings {
  id: number;
  name: string;
  slug: string;
  domain: string;
  website: string;
  phone: string;
  address: string;
  adminEmail: string;
  adminName: string;
  description: string;
  logoUrl: string;
  plan: string;
  status: string;
  maxCourses: number | null;
  maxStudents: number | null;
  settings: {
    features: TenantFeatures;
    portal: TenantPortal;
    branding: TenantBranding;
  };
}

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  trial:      { label: "Trial",       color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  starter:    { label: "Starter",     color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  growth:     { label: "Growth",      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  enterprise: { label: "Enterprise",  color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
};

function FeatureToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function OrganizationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OrgSettings | null>(null);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  useEffect(() => {
    void fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", { credentials: "include" });
      if (res.status === 403) {
        setIsTenantAdmin(false);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load settings");
      const json = await res.json() as OrgSettings;
      setData(json);
      setIsTenantAdmin(true);
    } catch {
      toast({ title: "Error", description: "Could not load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          domain: data.domain,
          website: data.website,
          phone: data.phone,
          address: data.address,
          adminEmail: data.adminEmail,
          adminName: data.adminName,
          description: data.description,
          logoUrl: data.logoUrl,
          settings: data.settings,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "Settings saved", description: "Your organization settings have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function setProfile(patch: Partial<OrgSettings>) {
    setData((d) => d ? { ...d, ...patch } : d);
  }

  function setFeature(key: keyof TenantFeatures, value: boolean) {
    setData((d) =>
      d ? { ...d, settings: { ...d.settings, features: { ...d.settings.features, [key]: value } } } : d
    );
  }

  function setPortal(patch: Partial<TenantPortal>) {
    setData((d) =>
      d ? { ...d, settings: { ...d.settings, portal: { ...d.settings.portal, ...patch } } } : d
    );
  }

  function setBranding(patch: Partial<TenantBranding>) {
    setData((d) =>
      d ? { ...d, settings: { ...d.settings, branding: { ...d.settings.branding, ...patch } } } : d
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isTenantAdmin) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              Organization Settings Unavailable
            </CardTitle>
            <CardDescription>
              Organization settings are only available to tenant administrators. You are currently logged in as a global admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To configure organization settings, log in as a tenant administrator (e.g. <code>admin@acme-language.com</code>).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const planInfo = PLAN_LABELS[data.plan] ?? { label: data.plan, color: "bg-muted text-muted-foreground" };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your organization profile, portal configuration, and system features.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Plan badge */}
      {data.settings.features.maintenanceMode && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Maintenance mode is <strong>ON</strong> — students cannot access the portal.</span>
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start gap-1 h-auto flex-wrap bg-transparent p-0 border-b rounded-none pb-0">
          {[
            { value: "profile",  label: "Organization Profile", icon: Building2 },
            { value: "features", label: "Features",             icon: Sliders },
            { value: "portal",   label: "Portal & Locale",      icon: Globe },
            { value: "branding", label: "Branding",             icon: Palette },
            { value: "plan",     label: "Plan & Limits",        icon: Crown },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2 px-4 pb-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Organization Profile ─────────────────────────────────────── */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
              <CardDescription>Your organization's public identity.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  value={data.name}
                  onChange={(e) => setProfile({ name: e.target.value })}
                  placeholder="Acme Language School"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug (read-only)</Label>
                <Input id="org-slug" value={data.slug} disabled className="bg-muted" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="org-desc">Description</Label>
                <Textarea
                  id="org-desc"
                  value={data.description}
                  onChange={(e) => setProfile({ description: e.target.value })}
                  placeholder="A short description of your organization…"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-logo" className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> Logo URL
                </Label>
                <Input
                  id="org-logo"
                  value={data.logoUrl}
                  onChange={(e) => setProfile({ logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                {data.logoUrl && (
                  <img src={data.logoUrl} alt="Logo preview" className="h-10 w-auto rounded border object-contain" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-domain" className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Custom Domain
                </Label>
                <Input
                  id="org-domain"
                  value={data.domain}
                  onChange={(e) => setProfile({ domain: e.target.value })}
                  placeholder="learn.acmelanguage.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription>Admin contact details for this organization.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-name" className="flex items-center gap-1.5">
                  Admin Name
                </Label>
                <Input
                  id="admin-name"
                  value={data.adminName}
                  onChange={(e) => setProfile({ adminName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Admin Email *
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={data.adminEmail}
                  onChange={(e) => setProfile({ adminEmail: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </Label>
                <Input
                  id="phone"
                  value={data.phone}
                  onChange={(e) => setProfile({ phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Website
                </Label>
                <Input
                  id="website"
                  value={data.website}
                  onChange={(e) => setProfile({ website: e.target.value })}
                  placeholder="https://acmelanguage.com"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </Label>
                <Textarea
                  id="address"
                  value={data.address}
                  onChange={(e) => setProfile({ address: e.target.value })}
                  placeholder="123 Main St, City, Country"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <TabsContent value="features" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" /> Student Access
              </CardTitle>
              <CardDescription>Control what students can do on your portal.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <FeatureToggle
                label="Student Self-Registration"
                description="Allow students to create their own accounts on the login page."
                checked={data.settings.features.selfRegistration}
                onChange={(v) => setFeature("selfRegistration", v)}
              />
              <FeatureToggle
                label="Course Discussions"
                description="Enable discussion posts within course lessons."
                checked={data.settings.features.discussions}
                onChange={(v) => setFeature("discussions", v)}
              />
              <FeatureToggle
                label="Quiz Retakes"
                description="Allow students to retake quizzes after completion."
                checked={data.settings.features.quizRetakes}
                onChange={(v) => setFeature("quizRetakes", v)}
              />
              <FeatureToggle
                label="Show Student Progress"
                description="Display progress bars and completion percentages to students."
                checked={data.settings.features.showStudentProgress}
                onChange={(v) => setFeature("showStudentProgress", v)}
              />
              <FeatureToggle
                label="File Uploads"
                description="Allow students to upload files for assignments."
                checked={data.settings.features.allowFileUploads}
                onChange={(v) => setFeature("allowFileUploads", v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications & Certificates</CardTitle>
              <CardDescription>Automate student communications and achievements.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <FeatureToggle
                label="Email Notifications"
                description="Send automated emails for enrollment, assignment feedback, and quiz results."
                checked={data.settings.features.emailNotifications}
                onChange={(v) => setFeature("emailNotifications", v)}
              />
              <FeatureToggle
                label="Course Completion Certificates"
                description="Issue a certificate PDF when a student completes a course."
                checked={data.settings.features.certificates}
                onChange={(v) => setFeature("certificates", v)}
              />
            </CardContent>
          </Card>

          <Card className="border-yellow-300 dark:border-yellow-700">
            <CardHeader>
              <CardTitle className="text-base text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Maintenance
              </CardTitle>
              <CardDescription>Temporarily take the student portal offline.</CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureToggle
                label="Maintenance Mode"
                description="Block student access to the portal with a maintenance message."
                checked={data.settings.features.maintenanceMode}
                onChange={(v) => setFeature("maintenanceMode", v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Portal & Locale ──────────────────────────────────────────── */}
        <TabsContent value="portal" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Portal</CardTitle>
              <CardDescription>Configure the student-facing portal experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Textarea
                  id="welcome"
                  value={data.settings.portal.welcomeMessage}
                  onChange={(e) => setPortal({ welcomeMessage: e.target.value })}
                  placeholder="Welcome to our IELTS preparation portal! We're glad you're here."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Displayed on the student login page.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email" className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Support Email
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={data.settings.portal.supportEmail}
                  onChange={(e) => setPortal({ supportEmail: e.target.value })}
                  placeholder="support@yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">Shown to students when they need help.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Locale & Timezone</CardTitle>
              <CardDescription>Default regional settings for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={data.settings.portal.defaultLanguage}
                  onValueChange={(v) => setPortal({ defaultLanguage: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={data.settings.portal.timezone}
                  onValueChange={(v) => setPortal({ timezone: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branding ─────────────────────────────────────────────────── */}
        <TabsContent value="branding" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Identity</CardTitle>
              <CardDescription>Customize how your portal looks to students.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagline">Organization Tagline</Label>
                <Input
                  id="tagline"
                  value={data.settings.branding.tagline}
                  onChange={(e) => setBranding({ tagline: e.target.value })}
                  placeholder="Achieve your IELTS goals with expert guidance"
                />
                <p className="text-xs text-muted-foreground">Shown below the organization name on the portal.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color (hex)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="accent-color"
                    value={data.settings.branding.accentColor}
                    onChange={(e) => setBranding({ accentColor: e.target.value })}
                    placeholder="#3b82f6"
                    className="font-mono"
                  />
                  {data.settings.branding.accentColor && (
                    <div
                      className="w-9 h-9 rounded-md border shrink-0"
                      style={{ background: data.settings.branding.accentColor }}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Used for buttons and highlights on the student portal.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Plan & Limits ─────────────────────────────────────────────── */}
        <TabsContent value="plan" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" /> Current Plan
              </CardTitle>
              <CardDescription>Your subscription plan and resource limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Plan:</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planInfo.color}`}>
                  {planInfo.label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  data.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {data.status}
                </span>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Courses</p>
                  <p className="text-2xl font-bold">
                    {data.maxCourses ?? <span className="text-muted-foreground text-base">Unlimited</span>}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Students</p>
                  <p className="text-2xl font-bold">
                    {data.maxStudents ?? <span className="text-muted-foreground text-base">Unlimited</span>}
                  </p>
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                To change your plan or limits, contact your platform administrator.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization ID</CardTitle>
              <CardDescription>Technical identifiers for this organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Tenant ID", value: String(data.id) },
                { label: "Slug",      value: data.slug },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{value}</code>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky save button at bottom on mobile */}
      <div className="flex justify-end pt-2 border-t">
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-32">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
