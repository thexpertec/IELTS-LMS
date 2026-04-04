import { useCreateQuiz, useListCourses, getListQuizzesQueryKey } from "@workspace/api-client-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { PartsEditor, type QuizPart } from "@/components/quiz/parts-editor";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional().default(""),
  passageText: z.string().optional().default(""),
  courseId: z.string().optional(),
  timeLimitMinutes: z.coerce.number().min(1).optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function QuizNew() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [parts, setParts] = useState<QuizPart[]>([]);
  const { data: courses } = useListCourses({});

  const params = new URLSearchParams(search);
  const prefilledCourseId = params.get("courseId") ?? undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      passageText: "",
      courseId: prefilledCourseId,
      timeLimitMinutes: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (prefilledCourseId) {
      form.setValue("courseId", prefilledCourseId);
    }
  }, [prefilledCourseId]);

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
        parts: parts.length > 0 ? parts : undefined,
        courseId: values.courseId && values.courseId !== "none" ? Number(values.courseId) : undefined,
        timeLimitMinutes: values.timeLimitMinutes ? Number(values.timeLimitMinutes) : undefined,
        isPublished: values.isPublished,
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
                    <Textarea
                      placeholder="Instructions or overview for students..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="input-description"
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
                    <Textarea
                      placeholder="Paste the reading passage here. Students will see it on the left while answering questions on the right..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                      data-testid="input-passage"
                    />
                  </FormControl>
                  <FormDescription>Leave empty if the quiz does not require a reading passage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <PartsEditor value={parts} onChange={setParts} />
            </div>

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Course (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-course">
                        <SelectValue placeholder="Select course..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No course</SelectItem>
                      {courses?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
