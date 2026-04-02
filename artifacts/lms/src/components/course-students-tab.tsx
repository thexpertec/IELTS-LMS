import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserPlus, Users, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Enrollment {
  id: number;
  courseId: number;
  studentName: string;
  studentEmail: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  progressPercent: number | null;
  courseName: string | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  dropped: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export function StudentsTab({ courseId }: { courseId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["course-enrollments", courseId],
    queryFn: () =>
      fetch(`/api/enrollments?courseId=${courseId}`).then((r) => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (body: { courseId: number; studentName: string; studentEmail: string; status: string }) =>
      fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to enroll student");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
      setName("");
      setEmail("");
      setShowForm(false);
      toast({ title: "Student enrolled" });
    },
    onError: () => toast({ title: "Failed to enroll student", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/enrollments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/enrollments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments", courseId] });
      toast({ title: "Enrollment removed" });
    },
    onError: () => toast({ title: "Failed to remove enrollment", variant: "destructive" }),
  });

  const sorted = [...enrollments].sort((a, b) => {
    const cmp = a.studentName.localeCompare(b.studentName);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleEnroll = () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    addMutation.mutate({ courseId, studentName: name.trim(), studentEmail: email.trim(), status: "active" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Enroll Student
        </Button>
      </div>

      {/* Enroll form */}
      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">New Enrollment</p>
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-[160px]"
            />
            <Input
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Button onClick={handleEnroll} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Enrolling…" : "Enroll"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl py-16 text-center text-muted-foreground">
          <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No students enrolled yet</p>
          <p className="text-sm mt-1">Click "Enroll Student" to add the first one.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          {/* Column header */}
          <div className="grid grid-cols-[2fr_2fr_1.2fr_1.2fr_auto] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <button
              className="flex items-center gap-1 text-left hover:text-foreground"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              Student
              {sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span>Email</span>
            <span>Progress</span>
            <span>Status</span>
            <span />
          </div>

          {/* Rows */}
          {sorted.map((en) => (
            <div
              key={en.id}
              className="grid grid-cols-[2fr_2fr_1.2fr_1.2fr_auto] gap-4 px-4 py-3 border-t items-center hover:bg-muted/20 transition-colors"
            >
              {/* Name + enrolled date */}
              <div>
                <div className="font-medium text-sm">{en.studentName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Enrolled {format(new Date(en.enrolledAt), "MMM d, yyyy")}
                </div>
              </div>

              {/* Email */}
              <div className="text-sm text-muted-foreground truncate">{en.studentEmail}</div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="text-xs font-medium">{en.progressPercent ?? 0}%</div>
                <Progress value={en.progressPercent ?? 0} className="h-1.5 w-full" />
              </div>

              {/* Status select */}
              <Select
                value={en.status}
                onValueChange={(v) => updateStatusMutation.mutate({ id: en.id, status: v })}
              >
                <SelectTrigger className="h-7 text-xs w-28 border-0 shadow-none p-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[en.status] ?? ""}`}>
                    {en.status.charAt(0).toUpperCase() + en.status.slice(1)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>

              {/* Remove */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove enrollment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove <strong>{en.studentName}</strong> from the course. Their submission history will remain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeMutation.mutate(en.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
