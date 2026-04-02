import { useListCourses, useUpdateCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Search, Filter, MoreVertical, Edit, Trash, Eye, EyeOff, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Courses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useListCourses({
    search: search || undefined,
    category: category && category !== "all" ? category : undefined,
  });

  const updateCourse = useUpdateCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to update course", variant: "destructive" });
      }
    }
  });

  const handleTogglePublish = (id: number, currentStatus: boolean) => {
    updateCourse.mutate({ id, data: { isPublished: !currentStatus } });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your educational content.</p>
        </div>
        <Link href="/courses/new">
          <Button data-testid="btn-create-course">
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-courses"
          />
        </div>
        <Select value={category || "all"} onValueChange={(val) => setCategory(val)}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card/50 border-dashed">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No courses found</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Get started by creating your first course.
          </p>
          <Link href="/courses/new">
            <Button data-testid="btn-empty-create-course">Create Course</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="list-courses">
          {courses?.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden hover:border-primary/50 transition-colors" data-testid={`card-course-${course.id}`}>
              {course.imageUrl ? (
                <div className="h-40 w-full bg-muted relative">
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-40 w-full bg-primary/10 flex items-center justify-center relative">
                  <BookOpen className="h-10 w-10 text-primary/40" />
                  <div className="absolute top-2 right-2">
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              )}
              
              <CardHeader className="flex-1 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge variant="outline" className="mb-2">{course.category}</Badge>
                    <CardTitle className="line-clamp-1 text-lg" title={course.title}>
                      <Link href={`/courses/${course.id}`} className="hover:underline">
                        {course.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/courses/${course.id}`}>
                        <DropdownMenuItem className="cursor-pointer" data-testid={`menu-edit-${course.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Manage
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem 
                        className="cursor-pointer" 
                        onClick={() => handleTogglePublish(course.id, course.isPublished)}
                        data-testid={`menu-publish-${course.id}`}
                      >
                        {course.isPublished ? (
                          <><EyeOff className="w-4 h-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Publish</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="capitalize">{course.level}</span>
                  </span>
                  {course.durationHours && (
                    <span className="flex items-center gap-1">
                      {course.durationHours}h
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardFooter className="pt-0">
                <Link href={`/courses/${course.id}`} className="w-full">
                  <Button variant="secondary" className="w-full" data-testid={`btn-manage-${course.id}`}>
                    Manage Course
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
