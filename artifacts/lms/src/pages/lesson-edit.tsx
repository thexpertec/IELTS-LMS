import { useGetLesson, useUpdateLesson, useListChapters, getListLessonsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MultiMediaUploadField } from "@/components/ui/multi-media-upload-field";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

const LESSON_TYPES = [
  { id: "reading",       label: "Reading" },
  { id: "writing",       label: "Writing" },
  { id: "listening",     label: "Listening" },
  { id: "speaking",      label: "Speaking" },
  { id: "grammar",       label: "Grammar" },
  { id: "vocabulary",    label: "Vocabulary" },
  { id: "pronunciation", label: "Pronunciation" },
  { id: "translation",   label: "Translation" },
] as const;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().max(200, "Keep it under 200 characters.").optional().or(z.literal("")),
  lessonType: z.string().min(1),
  content: z.string().refine(
    (val) => stripHtml(val).length >= 10,
    "Content must be at least 10 characters."
  ),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute.").optional().or(z.literal("")),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  chapterId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LessonEdit() {
  const { id: idStr, lessonId: lessonIdStr } = useParams();
  const courseId = Number(idStr);
  const lessonId = Number(lessonIdStr);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading, isError } = useGetLesson(courseId, lessonId);
  const { data: chapters = [] } = useListChapters(courseId);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      lessonType: "reading",
      content: "",
      videoUrl: "",
      durationMinutes: "",
      order: 1,
      chapterId: "none",
    },
  });

  useEffect(() => {
    if (lesson) {
      const l = lesson as unknown as {
        lessonType?: string;
        description?: string;
        imageUrl?: string | null;
        audioUrl?: string | null;
        imageUrls?: string[] | null;
        audioUrls?: string[] | null;
      };
      form.reset({
        title: lesson.title,
        description: l.description ?? "",
        lessonType: l.lessonType ?? "reading",
        content: lesson.content ?? "",
        videoUrl: lesson.videoUrl ?? "",
        durationMinutes: lesson.durationMinutes ?? "",
        order: lesson.order,
        chapterId: lesson.chapterId != null ? String(lesson.chapterId) : "none",
      });
      // Migrate: prefer arrays, fall back to legacy single-url fields
      if (l.imageUrls && l.imageUrls.length > 0) {
        setImageUrls(l.imageUrls);
      } else if (l.imageUrl) {
        setImageUrls([l.imageUrl]);
      } else {
        setImageUrls([]);
      }
      if (l.audioUrls && l.audioUrls.length > 0) {
        setAudioUrls(l.audioUrls);
      } else if (l.audioUrl) {
        setAudioUrls([l.audioUrl]);
      } else {
        setAudioUrls([]);
      }
    }
  }, [lesson]);

  const updateLesson = useUpdateLesson({
    mutation: {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(courseId) });
        toast({ title: "Lesson updated successfully" });
        const type = vars.data.lessonType ?? form.getValues("lessonType");
        setLocation(`/courses/${courseId}?tab=curriculum&sub=units&lessonType=${type}`);
      },
      onError: () => {
        toast({ title: "Failed to update lesson", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: FormValues) {
    updateLesson.mutate({
      courseId,
      id: lessonId,
      data: {
        title: values.title,
        description: values.description || "",
        lessonType: values.lessonType,
        content: values.content,
        videoUrl: values.videoUrl || null,
        imageUrl: imageUrls[0] || null,
        audioUrl: audioUrls[0] || null,
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
        audioUrls: audioUrls.length > 0 ? audioUrls : null,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
        order: Number(values.order),
        chapterId: values.chapterId && values.chapterId !== "none" ? Number(values.chapterId) : null,
      }
    });
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center text-muted-foreground">
        <p>Lesson not found.</p>
        <Button className="mt-4" onClick={() => setLocation(`/courses/${courseId}`)}>Back to Course</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-3 text-muted-foreground"
          onClick={() => setLocation(`/courses/${courseId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Lesson</h1>
        <p className="text-muted-foreground mt-1">Update this lesson's content and settings.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Introduction to Variables" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lessonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LESSON_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="A brief summary shown on lesson cards…" {...field} />
                </FormControl>
                <FormDescription>Up to 200 characters. Displayed as a preview below the lesson title.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {chapters.length > 0 && (
            <FormField
              control={form.control}
              name="chapterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">— No unit —</SelectItem>
                      {chapters.map((ch) => (
                        <SelectItem key={ch.id} value={String(ch.id)}>{ch.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Content / Notes</FormLabel>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Provide notes, reading material, or context for this lesson…"
                />
                <FormDescription>
                  Use the toolbar to apply headings, bold, lists, links, and more.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Media uploads */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <MultiMediaUploadField
                type="image"
                label="Images"
                values={imageUrls}
                onChange={setImageUrls}
              />
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <MultiMediaUploadField
                type="audio"
                label="Audio Files"
                values={audioUrls}
                onChange={setAudioUrls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Min)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence Order</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/courses/${courseId}`)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLesson.isPending}
            >
              {updateLesson.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
