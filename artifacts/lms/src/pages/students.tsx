import { useListEnrollments } from "@workspace/api-client-react";
import { Users, GraduationCap, Search, Mail, LogIn } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function Students() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: enrollments, isLoading } = useListEnrollments();

  // Group enrollments by student to create a unique student view
  const students = useMemo(() => {
    if (!enrollments) return [];

    const studentMap = new Map();

    enrollments.forEach(enroll => {
      const key = enroll.studentEmail; // Use email as unique identifier
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          name: enroll.studentName,
          email: enroll.studentEmail,
          enrollments: [],
          activeCount: 0,
          completedCount: 0,
          avgProgress: 0,
        });
      }

      const student = studentMap.get(key);
      student.enrollments.push(enroll);
      
      if (enroll.status === 'active') student.activeCount++;
      if (enroll.status === 'completed') student.completedCount++;
      
      // Update running average progress
      const totalProgress = student.enrollments.reduce((sum: number, e: any) => sum + e.progressPercent, 0);
      student.avgProgress = totalProgress / student.enrollments.length;
    });

    return Array.from(studentMap.values())
      .filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.email.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrollments, search]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
        <p className="text-muted-foreground mt-1">Overview of all unique learners across the platform.</p>
      </div>

      <div className="flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students by name or email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-students"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card/50 border-dashed">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No students found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria or enroll a student first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="list-students">
          {students.map((student) => (
            <Card key={student.email} className="hover:border-primary/50 transition-colors" data-testid={`card-student-${student.email}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border bg-primary/10 text-primary">
                    <AvatarFallback className="font-semibold bg-transparent">{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate" title={student.name}>{student.name}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 truncate" title={student.email}>
                      <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                      {student.email}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold text-foreground flex items-center justify-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {student.enrollments.length}
                    </p>
                  </div>
                  <div className="space-y-1 border-x">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="font-semibold text-blue-500">{student.activeCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-semibold text-green-500">{student.completedCount}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  data-testid={`btn-view-student-${student.email}`}
                  onClick={() => setLocation(`/enrollments?student=${encodeURIComponent(student.name)}`)}
                >
                  <LogIn className="w-4 h-4" />
                  View Enrollments
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}