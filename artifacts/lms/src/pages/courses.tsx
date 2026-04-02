import React from "react";
import { useListCourses, useUpdateCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Plus, Search, Filter, MoreVertical, Edit, Eye, EyeOff,
  BookOpen, Clock, Users, GraduationCap, Headphones, Mic,
  PenTool, Type, LayoutGrid, FileText, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── Category icons ─────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  reading: BookOpen, writing: PenTool, listening: Headphones,
  speaking: Mic, grammar: FileText, vocabulary: Type, general: LayoutGrid,
  development: BarChart2, design: PenTool, business: Users, marketing: Type,
};

function categoryIcon(category: string): React.ElementType {
  if (!category) return GraduationCap;
  const key = category.toLowerCase().replace(/\s+/g, "");
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return GraduationCap;
}

// ── Level colours ──────────────────────────────────────────────────────────────
function levelStyle(level: string) {
  if (!level) return { bg: "bg-muted", text: "text-muted-foreground" };
  const l = level.toLowerCase();
  if (l === "advanced") return { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400" };
  if (l === "intermediate") return { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" };
  return { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" };
}

// ── Component ──────────────────────────────────────────────────────────────────
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
      },
    },
  });

  const handleTogglePublish = (id: number, currentStatus: boolean) => {
    updateCourse.mutate({ id, data: { isPublished: !currentStatus } });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your educational content.</p>
        </div>
        <Link href="/courses/new">
          <Button data-testid="btn-create-course">
            <Plus className="w-4 h-4 mr-2" />New Course
          </Button>
        </Link>
      </div>

      {/* Filters */}
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
            <SelectItem value="IELTS">IELTS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-28 w-full" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-24 border rounded-xl bg-card/50 border-dashed">
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
          {courses?.map((course) => {
            const Icon = categoryIcon(course.category ?? "");
            const lvl = levelStyle(course.level ?? "");
            const published = course.isPublished;

            return (
              <Card
                key={course.id}
                className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 group border-0 shadow-sm ring-1 ring-border"
                data-testid={`card-course-${course.id}`}
              >
                {/* ── Gradient header ── */}
                <div className={cn(
                  "relative px-5 pt-5 pb-4",
                  published
                    ? "bg-gradient-to-br from-primary/8 via-indigo-50/70 to-violet-50/50 dark:from-primary/10 dark:via-indigo-950/20 dark:to-violet-950/10"
                    : "bg-gradient-to-br from-muted/80 via-slate-50 to-gray-50 dark:from-muted/30 dark:via-slate-950/20 dark:to-gray-950/10"
                )}>
                  {/* Course image overlay if present */}
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-15"
                    />
                  )}

                  <div className="relative flex items-start gap-3.5">
                    {/* Icon bubble */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                      published ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Status + category pills */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn(
                          "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          published
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {published ? "Published" : "Draft"}
                        </span>
                        {course.category && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground">
                            {course.category}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base leading-tight line-clamp-1">{course.title}</h3>
                      {course.instructor && (
                        <p className="text-xs text-muted-foreground mt-0.5">by {course.instructor}</p>
                      )}
                    </div>

                    {/* ⋯ Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg flex-shrink-0 hover:bg-black/10 dark:hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/courses/${course.id}`}>
                          <DropdownMenuItem className="cursor-pointer" data-testid={`menu-edit-${course.id}`}>
                            <Edit className="w-4 h-4 mr-2" />Manage
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleTogglePublish(course.id, course.isPublished)}
                          data-testid={`menu-publish-${course.id}`}
                        >
                          {published
                            ? <><EyeOff className="w-4 h-4 mr-2" />Unpublish</>
                            : <><Eye className="w-4 h-4 mr-2" />Publish</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* ── Body ── */}
                <CardContent className="flex-1 p-5 space-y-4">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-2">
                    {course.level && (
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg", lvl.bg, lvl.text)}>
                        <GraduationCap className="w-3 h-3" />
                        {course.level}
                      </span>
                    )}
                    {course.durationHours && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {course.durationHours}h
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <Link href={`/courses/${course.id}`} className="block">
                    <Button
                      variant="secondary"
                      className="w-full h-9 font-semibold gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      data-testid={`btn-manage-${course.id}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Manage Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
