import { useState, useEffect } from "react";
import { useGetCourse, useUpdateCourse, useDeleteCourse, getGetCourseQueryKey, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams, useSearch } from "wouter";
import { ArrowLeft, BookOpen, Clock, Trash2, Save, Upload, GraduationCap, Image, User, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { GradesTab } from "@/components/course-grades-tab";
import { CurriculumTab } from "@/components/curriculum-tab";
import { StreamTab } from "@/components/stream-tab";
import { StudentsTab } from "@/components/course-students-tab";
import { InstructorsTab } from "@/components/course-instructors-tab";
import { cn } from "@/lib/utils";

type SettingsForm = {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  durationHours: string;
  imageUrl: string;
  isPublished: boolean;
};

export default function CourseDetail() {
  const { id: idStr } = useParams();
  const id = Number(idStr);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settingsForm, setSettingsForm] = useState<SettingsForm>({
    title: "", description: "", instructor: "", category: "",
    level: "beginner", durationHours: "", imageUrl: "", isPublished: false,
  });
  const [settingsDirty, setSettingsDirty] = useState(false);

  const { data: course, isLoading: courseLoading } = useGetCourse(id, {
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) }
  });

  // Populate form when course loads
  useEffect(() => {
    if (course) {
      setSettingsForm({
        title: course.title ?? "",
        description: (course as any).description ?? "",
        instructor: course.instructor ?? "",
        category: course.category ?? "",
        level: course.level ?? "beginner",
        durationHours: course.durationHours ? String(course.durationHours) : "",
        imageUrl: (course as any).imageUrl ?? "",
        isPublished: course.isPublished,
      });
      setSettingsDirty(false);
    }
  }, [course]);

  function patchForm(patch: Partial<SettingsForm>) {
    setSettingsForm((f) => ({ ...f, ...patch }));
    setSettingsDirty(true);
  }

  const updateCourse = useUpdateCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course updated" });
        setSettingsDirty(false);
      },
      onError: () => {
        toast({ title: "Failed to save changes", variant: "destructive" });
      },
    }
  });

  function handleSaveSettings() {
    updateCourse.mutate({
      id,
      data: {
        title: settingsForm.title || undefined,
        description: settingsForm.description || undefined,
        instructor: settingsForm.instructor || undefined,
        category: settingsForm.category || undefined,
        level: (settingsForm.level as any) || undefined,
        durationHours: settingsForm.durationHours ? Number(settingsForm.durationHours) : undefined,
        imageUrl: settingsForm.imageUrl || undefined,
        isPublished: settingsForm.isPublished,
      } as any,
    });
  }

  const deleteCourse = useDeleteCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course deleted" });
        setLocation("/courses");
      },
      onError: () => toast({ title: "Failed to delete course", variant: "destructive" }),
    }
  });

  const tab = new URLSearchParams(search).get("tab") ?? "stream";

  if (courseLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto text-center py-24">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The course you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation("/courses")}>Return to Courses</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-3 text-muted-foreground"
            onClick={() => setLocation("/courses")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{course.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={course.isPublished ? "outline" : "default"}
            onClick={() => updateCourse.mutate({ id, data: { isPublished: !course.isPublished } })}
            disabled={updateCourse.isPending}
            data-testid="btn-toggle-publish"
          >
            {course.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" data-testid="btn-delete-course">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the course, all its lessons, and removes all enrollments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCourse.mutate({ id })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Course
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Meta row ── */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-y py-4">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span className="font-medium text-foreground">Category:</span> {course.category}
        </div>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">Instructor:</span> {course.instructor}
        </div>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-1.5 capitalize">
          <span className="font-medium text-foreground">Level:</span> {course.level}
        </div>
        {course.durationHours && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {course.durationHours} hours
            </div>
          </>
        )}
      </div>

      {/* ── Top-level Tabs ── */}
      <Tabs
        value={tab}
        onValueChange={(v) => setLocation(`/courses/${id}?tab=${v}`)}
        className="w-full"
      >
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0 mb-8">
          {[
            { value: "stream", label: "Stream", testId: "tab-stream" },
            { value: "curriculum", label: "Curriculum", testId: "tab-curriculum" },
            { value: "grades", label: "Grades", testId: "tab-grades" },
            { value: "students", label: "Students", testId: "tab-students" },
            { value: "instructors", label: "Instructors", testId: "tab-instructors" },
            { value: "settings", label: "Settings", testId: "tab-settings" },
          ].map(({ value, label, testId }) => (
            <TabsTrigger
              key={value}
              value={value}
              data-testid={testId}
              className="rounded-none border-b-2 border-transparent px-6 py-3 text-base font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Curriculum ── */}
        <TabsContent value="curriculum" className="space-y-6">
          <CurriculumTab courseId={id} />
        </TabsContent>

        {/* ── Grades ── */}
        <TabsContent value="grades" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Gradebook</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and enter grades for all students across every assignment.
            </p>
          </div>
          <GradesTab courseId={id} />
        </TabsContent>

        {/* ── Stream ── */}
        <TabsContent value="stream" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Stream</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Post announcements, manage discussions, and view upcoming items.
            </p>
          </div>
          <StreamTab courseId={id} />
        </TabsContent>

        {/* ── Students ── */}
        <TabsContent value="students" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Students</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage student enrollments and track their progress.
            </p>
          </div>
          <StudentsTab courseId={id} />
        </TabsContent>

        {/* ── Instructors ── */}
        <TabsContent value="instructors" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Instructors</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and manage the instructors for this course.
            </p>
          </div>
          <InstructorsTab course={course} />
        </TabsContent>

        {/* ── Settings ── */}
        <TabsContent value="settings">
          <div className="space-y-6">

            {/* Read-only meta card */}
            <Card className="ring-1 ring-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Course Information</CardTitle>
                <CardDescription>System-managed fields</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created by</p>
                    <p className="text-sm font-medium">{course.instructor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created on</p>
                    <p className="text-sm font-medium">{format(new Date(course.createdAt), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable settings */}
            <Card className="ring-1 ring-border">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Edit Course Details</CardTitle>
                  <CardDescription>Update course information below and save changes</CardDescription>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={!settingsDirty || updateCourse.isPending}
                  className={cn("shrink-0", settingsDirty && "bg-primary")}
                  data-testid="btn-save-settings"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateCourse.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </CardHeader>

              <CardContent className="space-y-6">

                {/* Active / Published toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {settingsForm.isPublished
                      ? <ToggleRight className="w-5 h-5 text-primary" />
                      : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-semibold">Course Status</p>
                      <p className="text-xs text-muted-foreground">
                        {settingsForm.isPublished
                          ? "Active — visible to enrolled students"
                          : "Draft — hidden from students"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", settingsForm.isPublished ? "text-primary" : "text-muted-foreground")}>
                      {settingsForm.isPublished ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      checked={settingsForm.isPublished}
                      onCheckedChange={(v) => patchForm({ isPublished: v })}
                      data-testid="switch-published"
                    />
                  </div>
                </div>

                {/* Thumbnail URL */}
                <div className="space-y-2">
                  <Label htmlFor="setting-thumbnail" className="flex items-center gap-2 text-sm font-medium">
                    <Image className="w-4 h-4" /> Course Thumbnail (URL)
                  </Label>
                  <div className="flex gap-3">
                    {settingsForm.imageUrl && (
                      <img
                        src={settingsForm.imageUrl}
                        alt="Thumbnail preview"
                        className="w-20 h-14 object-cover rounded-md border shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <Input
                      id="setting-thumbnail"
                      placeholder="https://example.com/image.jpg"
                      value={settingsForm.imageUrl}
                      onChange={(e) => patchForm({ imageUrl: e.target.value })}
                      data-testid="input-thumbnail"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Paste a public image URL to use as the course thumbnail.</p>
                </div>

                <Separator />

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="setting-title" className="text-sm font-medium">Course Title</Label>
                  <Input
                    id="setting-title"
                    value={settingsForm.title}
                    onChange={(e) => patchForm({ title: e.target.value })}
                    placeholder="e.g. IELTS Academic Preparation"
                    data-testid="input-title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="setting-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="setting-description"
                    rows={4}
                    value={settingsForm.description}
                    onChange={(e) => patchForm({ description: e.target.value })}
                    placeholder="Describe what students will learn…"
                    data-testid="textarea-description"
                  />
                </div>

                {/* Instructor */}
                <div className="space-y-2">
                  <Label htmlFor="setting-instructor" className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap className="w-4 h-4" /> Instructor Name
                  </Label>
                  <Input
                    id="setting-instructor"
                    value={settingsForm.instructor}
                    onChange={(e) => patchForm({ instructor: e.target.value })}
                    placeholder="e.g. John Smith"
                    data-testid="input-instructor"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="setting-category" className="text-sm font-medium">Category</Label>
                    <Input
                      id="setting-category"
                      value={settingsForm.category}
                      onChange={(e) => patchForm({ category: e.target.value })}
                      placeholder="e.g. IELTS"
                      data-testid="input-category"
                    />
                  </div>

                  {/* Level */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Level</Label>
                    <Select
                      value={settingsForm.level}
                      onValueChange={(v) => patchForm({ level: v })}
                    >
                      <SelectTrigger data-testid="select-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="setting-duration" className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4" /> Duration (hours)
                    </Label>
                    <Input
                      id="setting-duration"
                      type="number"
                      min={1}
                      value={settingsForm.durationHours}
                      onChange={(e) => patchForm({ durationHours: e.target.value })}
                      placeholder="e.g. 10"
                      data-testid="input-duration"
                    />
                  </div>
                </div>

                {/* Bottom save */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!settingsDirty || updateCourse.isPending}
                    data-testid="btn-save-settings-bottom"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateCourse.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
