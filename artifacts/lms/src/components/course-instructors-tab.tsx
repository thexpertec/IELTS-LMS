import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Check, X, GraduationCap, Mail, User } from "lucide-react";
import { getGetCourseQueryKey } from "@workspace/api-client-react";

interface Course {
  id: number;
  title: string;
  instructor: string;
  category: string;
  level: string;
}

export function InstructorsTab({ course }: { course: Course }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(course.instructor);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) {
      toast({ title: "Instructor name cannot be empty", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructor: value.trim() }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(course.id) });
      toast({ title: "Instructor updated" });
      setEditing(false);
    } catch {
      toast({ title: "Failed to update instructor", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(course.instructor);
    setEditing(false);
  };

  const initials = course.instructor
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Manage the instructor assigned to this course.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Lead Instructor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
              {initials}
            </div>

            {/* Info / edit */}
            <div className="flex-1 space-y-3">
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="instructor-name" className="text-xs text-muted-foreground">
                      Instructor name
                    </Label>
                    <Input
                      id="instructor-name"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium text-foreground text-base">{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {course.instructor.toLowerCase().replace(/\s+/g, ".").replace(/^dr\./i, "")}@school.edu
                    </div>
                    <div className="text-xs text-muted-foreground capitalize mt-1">
                      Teaching <span className="font-medium text-foreground">{course.category}</span> · {course.level} level
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setValue(course.instructor);
                      setEditing(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future multi-instructor support */}
      <div className="border-2 border-dashed rounded-xl py-10 text-center text-muted-foreground">
        <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm font-medium">Co-instructors &amp; TAs</p>
        <p className="text-xs mt-1">Support for multiple instructors will be added in a future update.</p>
      </div>
    </div>
  );
}
