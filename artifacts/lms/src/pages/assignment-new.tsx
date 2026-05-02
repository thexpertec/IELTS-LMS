import { useState } from "react";
import { useCreateAssignment, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseLessonPicker } from "@/components/ui/course-lesson-picker";

const formSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  chapterId: z.string().optional().default("none"),
  lessonId: z.string().optional().default("none"),
  lessonType: z.string().optional(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["assignment", "quiz"]),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().default("23:59"),
  maxScore: z.coerce.number().min(1).max(1000),
});

type FormValues = z.infer<typeof formSchema>;

export default function AssignmentNew() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(search);
  const prefilledCourseId = params.get("courseId") ?? "";
  const prefilledChapterId = params.get("chapterId") ?? "none";
  const prefilledLessonType = params.get("lessonType") ?? undefined;

  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: prefilledCourseId,
      chapterId: prefilledChapterId,
      lessonId: "none",
      lessonType: prefilledLessonType,
      title: "",
      description: "",
      type: "assignment",
      dueDate: "",
      dueTime: "23:59",
      maxScore: 100,
    },
  });

  const createAssignment = useCreateAssignment({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        toast({ title: "Assignment created" });
        setLocation(`/assignments/${data.id}`);
      },
      onError: () => toast({ title: "Failed to create assignment", variant: "destructive" }),
    },
  });

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const withProtocol = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    if (!attachedLinks.includes(withProtocol)) {
      setAttachedLinks((prev) => [...prev, withProtocol]);
    }
    setLinkInput("");
  };

  const removeLink = (idx: number) =>
    setAttachedLinks((prev) => prev.filter((_, i) => i !== idx));

  function onSubmit(values: FormValues) {
    const dueDatetime = new Date(`${values.dueDate}T${values.dueTime}:00`).toISOString();
    createAssignment.mutate({
      data: {
        courseId: Number(values.courseId),
        chapterId: values.chapterId && values.chapterId !== "none" ? Number(values.chapterId) : undefined,
        lessonId: values.lessonId && values.lessonId !== "none" ? Number(values.lessonId) : undefined,
        lessonType: values.lessonType ?? undefined,
        title: values.title,
        description: values.description ?? "",
        type: values.type,
        dueDate: dueDatetime,
        maxScore: values.maxScore,
        attachedLinks,
      } as any,
    });
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-3 text-muted-foreground"
          onClick={() => setLocation("/assignments")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assignments
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Assignment</h1>
        <p className="text-muted-foreground mt-1">Create a new assignment or task for students.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-6">
          <div className="space-y-1.5">
            <p className="text-sm font-medium leading-none">Link to Course / Unit / Lesson</p>
            <CourseLessonPicker
              courseId={form.watch("courseId") || "none"}
              chapterId={form.watch("chapterId") || "none"}
              lessonId={form.watch("lessonId") || "none"}
              onCourseChange={(val) => form.setValue("courseId", val === "none" ? "" : val)}
              onChapterChange={(val) => form.setValue("chapterId", val)}
              onLessonChange={(val, type) => {
                form.setValue("lessonId", val);
                if (type) form.setValue("lessonType", type);
              }}
            />
            {form.formState.errors.courseId && (
              <p className="text-sm text-destructive">{form.formState.errors.courseId.message}</p>
            )}
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Week 3 Essay — IELTS Task 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions / Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide detailed instructions for students…"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Students will see this when opening the assignment.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Attached Links */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Reference Links <span className="text-muted-foreground font-normal">(optional)</span></p>
            <p className="text-xs text-muted-foreground">Add links students should refer to — e.g. Google Forms, documents, resources.</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/…"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addLink} className="gap-1.5 flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
            {attachedLinks.length > 0 && (
              <div className="space-y-1.5">
                {attachedLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary hover:underline">
                      {link}
                    </a>
                    <button type="button" onClick={() => removeLink(idx)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Score</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={1000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={() => setLocation("/assignments")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAssignment.isPending}>
              {createAssignment.isPending ? "Creating…" : "Create Assignment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
