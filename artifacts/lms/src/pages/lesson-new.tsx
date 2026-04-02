import { useCreateLesson, getListLessonsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute.").optional().or(z.literal("")),
  order: z.coerce.number().min(1, "Order must be at least 1"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LessonNew() {
  const { id: idStr } = useParams();
  const courseId = Number(idStr);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      videoUrl: "",
      durationMinutes: "",
      order: 1,
    },
  });

  const createLesson = useCreateLesson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(courseId) });
        toast({ title: "Lesson created successfully" });
        setLocation(`/courses/${courseId}`);
      },
      onError: () => {
        toast({ title: "Failed to create lesson", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: FormValues) {
    createLesson.mutate({
      courseId,
      data: {
        title: values.title,
        content: values.content,
        videoUrl: values.videoUrl || null,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
        order: Number(values.order),
      }
    });
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-3 text-muted-foreground"
          onClick={() => setLocation(`/courses/${courseId}`)}
          data-testid="btn-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add Lesson</h1>
        <p className="text-muted-foreground mt-1">Create new content for this course.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Introduction to Variables" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Content / Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Provide notes, reading material, or context for this lesson..." 
                    className="min-h-[200px] font-mono text-sm"
                    {...field} 
                    data-testid="input-content"
                  />
                </FormControl>
                <FormDescription>Supports basic text formatting.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Embed URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/..." {...field} data-testid="input-video" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Min)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 15" {...field} data-testid="input-duration" />
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
                      <Input type="number" min="1" {...field} data-testid="input-order" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              disabled={createLesson.isPending}
              data-testid="btn-submit"
            >
              {createLesson.isPending ? "Saving..." : "Save Lesson"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}