import { useCreateQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { CourseLessonPicker } from "@/components/ui/course-lesson-picker";
import { MultiMediaUploadField } from "@/components/ui/multi-media-upload-field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional().default(""),
  passageText: z.string().optional().default(""),
  videoUrl: z.string().optional().default(""),
  courseId: z.string().optional().default("none"),
  chapterId: z.string().optional().default("none"),
  lessonId: z.string().optional().default("none"),
  lessonType: z.string().optional(),
  timeLimitMinutes: z.coerce.number().min(1).optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function QuizNew() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);

  const params = new URLSearchParams(search);
  const prefilledCourseId = params.get("courseId") ?? "none";
  const prefilledChapterId = params.get("chapterId") ?? "none";
  const prefilledLessonType = params.get("lessonType") ?? undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      passageText: "",
      videoUrl: "",
      courseId: prefilledCourseId,
      chapterId: prefilledChapterId,
      lessonId: "none",
      lessonType: prefilledLessonType,
      timeLimitMinutes: "",
      isPublished: false,
    },
  });

  const createQuiz = useCreateQuiz({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        toast({ title: "Quiz created! Now add your questions." });
        setLocation(`/quizzes/${data.id}`);
      },
      onError: () => toast({ title: "Failed to create quiz", variant: "destructive" }),
    },
  });

  function onSubmit(values: FormValues) {
    createQuiz.mutate({
      data: {
        title: values.title,
        description: values.description || "",
        passageText: values.passageText || undefined,
        courseId: values.courseId && values.courseId !== "none" ? Number(values.courseId) : undefined,
        chapterId: values.chapterId && values.chapterId !== "none" ? Number(values.chapterId) : undefined,
        lessonId: values.lessonId && values.lessonId !== "none" ? Number(values.lessonId) : undefined,
        lessonType: values.lessonType ?? undefined,
        timeLimitMinutes: values.timeLimitMinutes ? Number(values.timeLimitMinutes) : undefined,
        isPublished: values.isPublished,
        // @ts-expect-error — extra fields not yet in generated API types
        videoUrl: values.videoUrl || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        audioUrls: audioUrls.length > 0 ? audioUrls : undefined,
      },
    });
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-3 text-muted-foreground"
          onClick={() => setLocation("/quizzes")}
          data-testid="btn-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Quiz</h1>
        <p className="text-muted-foreground mt-1">Set up the quiz details first, then add questions.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Quiz Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Reading Comprehension Quiz" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val)}
                      placeholder="Instructions or overview for students..."
                      minHeight="120px"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passageText"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Reading Passage <span className="text-muted-foreground font-normal text-xs">(optional — shown to students on the left side during the quiz)</span></FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val)}
                      placeholder="Paste the reading passage here. Students will see it on the left while answering questions on the right..."
                      minHeight="200px"
                    />
                  </FormControl>
                  <FormDescription>Leave empty if the quiz does not require a reading passage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="md:col-span-2 space-y-1.5">
              <p className="text-sm font-medium leading-none">Link to Course / Unit / Lesson <span className="text-muted-foreground font-normal">(optional)</span></p>
              <CourseLessonPicker
                courseId={form.watch("courseId") ?? "none"}
                chapterId={form.watch("chapterId") ?? "none"}
                lessonId={form.watch("lessonId") ?? "none"}
                onCourseChange={(val) => form.setValue("courseId", val)}
                onChapterChange={(val) => form.setValue("chapterId", val)}
                onLessonChange={(val, type) => {
                  form.setValue("lessonId", val);
                  if (type) form.setValue("lessonType", type);
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="timeLimitMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 30 (leave blank for no limit)"
                      {...field}
                      data-testid="input-time-limit"
                    />
                  </FormControl>
                  <FormDescription>Leave empty if there's no time limit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2 bg-card">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish Quiz</FormLabel>
                    <FormDescription>Make this quiz visible to students immediately.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-publish" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createQuiz.isPending} data-testid="btn-submit">
              {createQuiz.isPending ? "Creating..." : "Create Quiz & Add Questions"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
