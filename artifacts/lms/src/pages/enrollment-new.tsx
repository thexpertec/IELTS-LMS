import { useCreateEnrollment, useListCourses, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronsUpDown, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentOption = {
  email: string;
  displayName: string;
};

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState("");

  const { data: courses, isLoading: coursesLoading } = useListCourses();

  const { data: students = [] } = useQuery<StudentOption[]>({
    queryKey: ["admin-students-picker"],
    queryFn: async () => {
      const res = await fetch("/api/admin/students", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      studentName: "",
      studentEmail: "",
    },
  });

  useEffect(() => {
    if (pickerValue) {
      const found = students.find((s) => s.email === pickerValue);
      if (found) {
        form.setValue("studentName", found.displayName, { shouldValidate: true });
        form.setValue("studentEmail", found.email, { shouldValidate: true });
      }
    }
  }, [pickerValue, students, form]);

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

  const selectedStudent = students.find((s) => s.email === pickerValue);

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
        <p className="text-muted-foreground mt-1">Add a student to a course.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-lg p-6 shadow-sm">

          {students.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Pick from Student Directory
              </label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    className="w-full justify-between font-normal"
                    data-testid="btn-student-picker"
                  >
                    {selectedStudent ? (
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedStudent.displayName}</span>
                        <span className="text-muted-foreground text-xs">({selectedStudent.email})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Search students…
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or email…" />
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.email}
                            value={`${s.displayName} ${s.email}`}
                            onSelect={() => {
                              setPickerValue(s.email === pickerValue ? "" : s.email);
                              setPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                pickerValue === s.email ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{s.displayName}</span>
                            <span className="ml-2 text-muted-foreground text-xs">{s.email}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Selecting a student auto-fills the fields below. You can also fill them manually.
              </p>
            </div>
          )}

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
