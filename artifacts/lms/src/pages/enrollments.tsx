import { useListEnrollments, useUpdateEnrollment, useDeleteEnrollment, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { Plus, Search, MoreHorizontal, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

export default function Enrollments() {
  const queryString = useSearch();
  const params = new URLSearchParams(queryString);
  const prefilter = params.get("student") ?? "";

  const [search, setSearch] = useState(prefilter);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (prefilter) setSearch(prefilter);
  }, [prefilter]);

  const { data: enrollments, isLoading } = useListEnrollments({
    studentName: search || undefined,
  });

  const updateEnrollment = useUpdateEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        toast({ title: "Enrollment status updated" });
      }
    }
  });

  const deleteEnrollment = useDeleteEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        toast({ title: "Enrollment deleted" });
      }
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'dropped':
        return <Badge variant="secondary">Dropped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
          <p className="text-muted-foreground mt-1">Manage student course enrollments.</p>
        </div>
        <Link href="/enrollments/new">
          <Button data-testid="btn-new-enrollment">
            <Plus className="w-4 h-4 mr-2" />
            Enroll Student
          </Button>
        </Link>
      </div>

      {prefilter && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
          <User className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-primary">
            Viewing enrollments for <span className="font-bold">{prefilter}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-primary hover:text-primary"
            data-testid="btn-clear-student-filter"
            onClick={() => { setSearch(""); window.history.replaceState(null, "", "/enrollments"); }}
          >
            Clear filter
          </Button>
        </div>
      )}

      <div className="flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by student name..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-enrollments"
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Enrolled Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : !enrollments || enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                  <TableCell>
                    <div className="font-medium">{enrollment.studentName}</div>
                    <div className="text-xs text-muted-foreground">{enrollment.studentEmail}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={enrollment.courseName || `Course #${enrollment.courseId}`}>
                    {enrollment.courseName || `Course #${enrollment.courseId}`}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(enrollment.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={enrollment.progressPercent} className="w-[60px]" />
                      <span className="text-xs font-medium">{Math.round(enrollment.progressPercent)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {enrollment.status !== 'active' && (
                          <DropdownMenuItem 
                            onClick={() => updateEnrollment.mutate({ id: enrollment.id, data: { status: 'active' } })}
                            data-testid={`menu-active-${enrollment.id}`}
                          >
                            <User className="mr-2 h-4 w-4" /> Mark as Active
                          </DropdownMenuItem>
                        )}
                        {enrollment.status !== 'completed' && (
                          <DropdownMenuItem 
                            onClick={() => updateEnrollment.mutate({ id: enrollment.id, data: { status: 'completed' } })}
                            data-testid={`menu-complete-${enrollment.id}`}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                          </DropdownMenuItem>
                        )}
                        {enrollment.status !== 'dropped' && (
                          <DropdownMenuItem 
                            onClick={() => updateEnrollment.mutate({ id: enrollment.id, data: { status: 'dropped' } })}
                            data-testid={`menu-drop-${enrollment.id}`}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Mark as Dropped
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this enrollment?')) {
                              deleteEnrollment.mutate({ id: enrollment.id });
                            }
                          }}
                          data-testid={`menu-delete-${enrollment.id}`}
                        >
                          Delete Enrollment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}