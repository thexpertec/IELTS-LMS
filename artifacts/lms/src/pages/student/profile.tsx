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
import { User, Mail, FileText, BookOpen, CheckCircle, TrendingUp, Save, Edit2 } from "lucide-react";
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
import { format } from "date-fns";

export default function Profile() {
  const { student, login } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", bio: "" });

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
      setForm({ displayName: profile.displayName, bio: profile.bio ?? "" });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!email) return;
    try {
      await updateProfile.mutateAsync({
        data: { email, displayName: form.displayName, bio: form.bio },
      });
      await queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey({ email }) });
      login(email, form.displayName);
      setEditing(false);
      toast({ title: "Saved!", description: "Your profile has been updated." });
    } catch {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    }
  };

  const initials = profile?.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const activeEnrollments = enrollments?.filter((e) => e.status === "active") ?? [];
  const completedEnrollments = enrollments?.filter((e) => e.status === "completed") ?? [];
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
    : 0;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and view your academic history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>Personal Information</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (editing) handleSave();
                else setEditing(true);
              }}
            >
              {editing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{profile?.displayName}</p>
                  <p className="text-muted-foreground text-sm">{email}</p>
                  {profile?.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Member since {format(new Date(profile.createdAt), "MMMM yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Display Name
                  </Label>
                  {editing ? (
                    <Input
                      id="displayName"
                      value={form.displayName}
                      onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                      data-testid="input-display-name"
                    />
                  ) : (
                    <p className="text-sm">{profile?.displayName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email Address
                  </Label>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Bio
                  </Label>
                  {editing ? (
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder="Tell us a bit about yourself..."
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      data-testid="input-bio"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profile?.bio || "No bio added yet."}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
                    {e.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{e.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{e.instructor} · {e.courseCategory}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={e.status === "completed" ? "outline" : "secondary"} className={`text-xs mb-1 ${e.status === "completed" ? "text-green-500 border-green-500/50" : ""}`}>
                      {e.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {e.progressPercent}%
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
