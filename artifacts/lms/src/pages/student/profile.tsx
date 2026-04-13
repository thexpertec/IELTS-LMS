import { useState, useEffect } from "react";
import {
  useGetStudentProfile,
  useUpdateStudentProfile,
  useGetStudentEnrollments,
  getGetStudentProfileQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, FileText, BookOpen, CheckCircle, TrendingUp,
  Save, Edit2, Phone, MapPin, GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const QUALIFICATION_OPTIONS = [
  "High School / O-Levels",
  "A-Levels / Intermediate",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD / Doctorate",
  "Diploma",
  "Professional Certificate",
  "Other",
];

type ProfileForm = {
  displayName: string;
  bio: string;
  phone: string;
  city: string;
  lastQualification: string;
};

export default function Profile() {
  const { student, login } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    displayName: "", bio: "", phone: "", city: "", lastQualification: "",
  });

  const { data: profile, isLoading } = useGetStudentProfile(
    { email },
    { query: { enabled: !!email } }
  );
  const { data: enrollments } = useGetStudentEnrollments(
    { email },
    { query: { enabled: !!email } }
  );
  const updateProfile = useUpdateStudentProfile();

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        bio: (profile as any).bio ?? "",
        phone: (profile as any).phone ?? "",
        city: (profile as any).city ?? "",
        lastQualification: (profile as any).lastQualification ?? "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!email) return;
    try {
      await updateProfile.mutateAsync({
        data: {
          email,
          displayName: form.displayName,
          bio: form.bio,
          phone: form.phone || undefined,
          city: form.city || undefined,
          lastQualification: form.lastQualification || undefined,
        } as any,
      });
      await queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey({ email }) });
      login(email, form.displayName);
      setEditing(false);
      toast({ title: "Profile saved!", description: "Your information has been updated." });
    } catch {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    }
  };

  const p = profile as any;
  const initials = p?.displayName
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const activeEnrollments = enrollments?.filter((e) => e.status === "active") ?? [];
  const completedEnrollments = enrollments?.filter((e) => e.status === "completed") ?? [];
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
    : 0;

  function field(key: keyof ProfileForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and view your academic history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{enrollments?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{completedEnrollments.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{avgProgress}%</p>
            <p className="text-sm text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>Personal Information</CardTitle>
            <div className="flex gap-2">
              {editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              )}
              <Button
                variant={editing ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => { if (editing) handleSave(); else setEditing(true); }}
                disabled={updateProfile.isPending}
              >
                {editing
                  ? <><Save className="w-4 h-4" />{updateProfile.isPending ? "Saving…" : "Save Changes"}</>
                  : <><Edit2 className="w-4 h-4" />Edit Profile</>}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              {/* Avatar + name header */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{p?.displayName}</p>
                  <p className="text-muted-foreground text-sm">{email}</p>
                  {p?.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Member since {format(new Date(p.createdAt), "MMMM yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* ── Contact section ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Contact & Location
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display name */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />Display Name
                    </Label>
                    {editing
                      ? <Input {...field("displayName")} data-testid="input-display-name" />
                      : <p className="text-sm">{p?.displayName}</p>}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />Email Address
                    </Label>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />Phone Number
                    </Label>
                    {editing
                      ? <Input placeholder="+92 300 1234567" {...field("phone")} />
                      : <p className="text-sm text-muted-foreground">{p?.phone || "Not provided"}</p>}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />City
                    </Label>
                    {editing
                      ? <Input placeholder="e.g. Karachi" {...field("city")} />
                      : <p className="text-sm text-muted-foreground">{p?.city || "Not provided"}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Academic section ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Academic Background
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Last Qualification */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4" />Last Qualification
                    </Label>
                    {editing ? (
                      <Select
                        value={form.lastQualification || "__none__"}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, lastQualification: v === "__none__" ? "" : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Select —</SelectItem>
                          {QUALIFICATION_OPTIONS.map((q) => (
                            <SelectItem key={q} value={q}>{q}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      p?.lastQualification
                        ? <Badge variant="secondary">{p.lastQualification}</Badge>
                        : <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>

                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4" />Bio
                  </Label>
                  {editing ? (
                    <Textarea
                      rows={3}
                      placeholder="Tell us a bit about yourself…"
                      className="resize-none"
                      {...field("bio")}
                      data-testid="input-bio"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {p?.bio || "No bio added yet."}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Academic History */}
      <Card>
        <CardHeader>
          <CardTitle>Academic History</CardTitle>
          <CardDescription>All courses you have enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {!enrollments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No course history yet.</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    e.status === "completed" ? "bg-green-500/10" : "bg-blue-500/10"
                  }`}>
                    {e.status === "completed"
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <BookOpen className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{e.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{e.instructor} · {e.courseCategory}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge
                      variant={e.status === "completed" ? "outline" : "secondary"}
                      className={`text-xs mb-1 ${e.status === "completed" ? "text-green-500 border-green-500/50" : ""}`}
                    >
                      {e.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />{e.progressPercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
