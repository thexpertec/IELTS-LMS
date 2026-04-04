import { useCreateAssignment, useListCourses, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
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
  const { data: courses } = useListCourses();

  const params = new URLSearchParams(search);
  const prefilledCourseId = params.get("courseId") ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: prefilledCourseId,
      title: "",
      description: "",
      type: "assignment",
      dueDate: "",
      dueTime: "23:59",
      maxScore: 100,
    },
  });

  useEffect(() => {
    if (prefilledCourseId) {
      form.setValue("courseId", prefilledCourseId);
    }
  }, [prefilledCourseId]);

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

  function onSubmit(values: FormValues) {
    const dueDatetime = new Date(`${values.dueDate}T${values.dueTime}:00`).toISOString();
    createAssignment.mutate({
      data: {
        courseId: Number(values.courseId),
        title: values.title,
        description: values.description ?? "",
        type: values.type,
        dueDate: dueDatetime,
        maxScore: values.maxScore,
      },
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
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(courses ?? []).map((c) => (
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
