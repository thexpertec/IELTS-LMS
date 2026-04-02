import { useCreateEnrollment, useListCourses, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  courseId: z.string().min(1, "Please select a course."),
  studentName: z.string().min(2, "Student name is required."),
  studentEmail: z.string().email("Must be a valid email address."),
});

type FormValues = z.infer<typeof formSchema>;

export default function EnrollmentNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useListCourses();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      studentName: "",
      studentEmail: "",
    },
  });

  const createEnrollment = useCreateEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        toast({ title: "Student enrolled successfully" });
        setLocation("/enrollments");
      },
      onError: () => {
        toast({ title: "Failed to enroll student", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: FormValues) {
    createEnrollment.mutate({
      data: {
        courseId: Number(values.courseId),
        studentName: values.studentName,
        studentEmail: values.studentEmail,
      }
    });
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-3 text-muted-foreground"
          onClick={() => setLocation("/enrollments")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Enrollments
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Enroll Student</h1>
        <p className="text-muted-foreground mt-1">Add a new student to a course.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-6 shadow-sm">
          <FormField
            control={form.control}
            name="studentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Smith" {...field} data-testid="input-student-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. john@example.com" {...field} data-testid="input-student-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={coursesLoading}>
                  <FormControl>
                    <SelectTrigger data-testid="select-course">
                      <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Only published and draft courses are available.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={createEnrollment.isPending}
              data-testid="btn-submit"
            >
              {createEnrollment.isPending ? "Enrolling..." : "Enroll Student"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}