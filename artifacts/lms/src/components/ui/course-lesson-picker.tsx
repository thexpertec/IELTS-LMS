import { useEffect } from "react";
import { useListCourses, useListChapters, useListLessons } from "@workspace/api-client-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CourseLessonPickerProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  onCourseChange: (val: string) => void;
  onChapterChange: (val: string) => void;
  onLessonChange: (val: string, lessonType?: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function CourseLessonPicker({
  courseId,
  chapterId,
  lessonId,
  onCourseChange,
  onChapterChange,
  onLessonChange,
  disabled,
  className,
}: CourseLessonPickerProps) {
  const { data: courses } = useListCourses({});
  const numericCourseId = courseId && courseId !== "none" ? Number(courseId) : undefined;
  const numericChapterId = chapterId && chapterId !== "none" ? Number(chapterId) : undefined;

  const { data: chapters = [] } = useListChapters(numericCourseId!, {
    query: { enabled: !!numericCourseId },
  });

  const { data: allLessons = [] } = useListLessons(numericCourseId!, {
    query: { enabled: !!numericCourseId },
  });

  const lessons = allLessons.filter(
    (l) => l.chapterId === numericChapterId
  );

  const sortedChapters = [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedLessons = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  useEffect(() => {
    if (chapterId && chapterId !== "none") {
      const exists = chapters.some((c) => String(c.id) === chapterId);
      if (!exists && chapters.length > 0) {
        onChapterChange("none");
        onLessonChange("none", null);
      }
    }
  }, [chapters]);

  useEffect(() => {
    if (lessonId && lessonId !== "none") {
      const exists = lessons.some((l) => String(l.id) === lessonId);
      if (!exists && lessons.length > 0) {
        onLessonChange("none", null);
      }
    }
  }, [lessons]);

  function handleCourseChange(val: string) {
    onCourseChange(val);
    onChapterChange("none");
    onLessonChange("none", null);
  }

  function handleChapterChange(val: string) {
    onChapterChange(val);
    onLessonChange("none", null);
  }

  function handleLessonChange(val: string) {
    const lesson = allLessons.find((l) => String(l.id) === val);
    onLessonChange(val, lesson?.lessonType ?? null);
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <div className="space-y-1.5">
        <Label>Course</Label>
        <Select
          value={courseId || "none"}
          onValueChange={handleCourseChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select course…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No course</SelectItem>
            {(courses ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Unit</Label>
        <Select
          value={chapterId || "none"}
          onValueChange={handleChapterChange}
          disabled={disabled || !numericCourseId}
        >
          <SelectTrigger>
            <SelectValue placeholder={numericCourseId ? "Select unit…" : "Select course first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No unit</SelectItem>
            {sortedChapters.map((ch) => (
              <SelectItem key={ch.id} value={String(ch.id)}>
                {ch.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Lesson</Label>
        <Select
          value={lessonId || "none"}
          onValueChange={handleLessonChange}
          disabled={disabled || !numericChapterId}
        >
          <SelectTrigger>
            <SelectValue placeholder={numericChapterId ? "Select lesson…" : "Select unit first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No lesson</SelectItem>
            {sortedLessons.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
