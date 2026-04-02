import { useState } from "react";
import { useListAssignments, useDeleteAssignment, getListAssignmentsQueryKey, useListCourses } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import { Plus, Trash2, Eye, FileText, ChevronDown, Search, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Assignments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const { data: assignments, isLoading } = useListAssignments();
  const { data: courses } = useListCourses();
  const deleteAssignment = useDeleteAssignment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        toast({ title: "Assignment deleted" });
      },
      onError: () => toast({ title: "Failed to delete assignment", variant: "destructive" }),
    },
  });

  const filtered = (assignments ?? []).filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchCourse = courseFilter === "all" || String(a.courseId) === courseFilter;
    return matchSearch && matchCourse;
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">Create and manage student assignments.</p>
        </div>
        <Button onClick={() => setLocation("/assignments/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {(courses ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-lg">No assignments found</p>
            <p className="text-muted-foreground text-sm mb-4">
              {search || courseFilter !== "all" ? "Try adjusting your filters." : "Get started by creating your first assignment."}
            </p>
            {!search && courseFilter === "all" && (
              <Button onClick={() => setLocation("/assignments/new")} className="gap-2">
                <Plus className="w-4 h-4" /> New Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const due = new Date(a.dueDate);
            const overdue = isPast(due);
            return (
              <Card key={a.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    a.type === "quiz" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    <FileText className={`w-5 h-5 ${a.type === "quiz" ? "text-purple-600" : "text-blue-600"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-0.5">
                      <Badge variant="secondary" className="text-xs capitalize">{a.type}</Badge>
                      {a.courseTitle && (
                        <Badge variant="outline" className="text-xs">{a.courseTitle}</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm leading-tight">{a.title}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className={overdue ? "text-destructive font-medium" : ""}>
                          Due {format(due, "MMM d, yyyy")}
                          {overdue ? " (Overdue)" : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {a.maxScore} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {a.submissionCount} submission{a.submissionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation(`/assignments/${a.id}`)}>
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{a.title}"? All submissions will also be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteAssignment.mutate({ id: a.id })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
