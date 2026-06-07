import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, ClipboardList, BookOpen, AlertCircle, Plus, Trash2, Pencil, Download, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const api = (path: string) => `${BASE}${path}`;

interface PlacementAttempt {
  id: number;
  studentEmail: string;
  studentName: string;
  score: number;
  maxScore: number;
  level: string;
  recommendedCourseId: number | null;
  recommendedCourseTitle: string | null;
  assignedCourseId: number | null;
  assignedCourseTitle: string | null;
  assignedAt: string | null;
  source: string;
  notes: string | null;
  takenAt: string;
}

interface ScoreRange {
  min: number;
  max: number;
  level: string;
  label: string;
  courseId?: number | null;
}

interface Course { id: number; title: string; }

interface PlacementSettings {
  requirePlacementTest: boolean;
  scoreRanges: ScoreRange[];
  courses: Course[];
}

interface ReportRow {
  studentName: string;
  studentEmail: string;
  placementScore: number;
  level: string;
  recommendedCourse: string;
  assignedCourse: string;
  progressPercent: number;
  completionStatus: string;
  takenAt: string;
}

const LEVEL_COLORS: Record<string, string> = {
  A2: "bg-slate-100 text-slate-700 border-slate-200",
  B1: "bg-blue-100 text-blue-700 border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {level}
    </span>
  );
}

export default function PlacementResults() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("results");

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; attempt: PlacementAttempt | null }>({ open: false, attempt: null });
  const [assignCourseId, setAssignCourseId] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");

  // Manual score dialog
  const [manualDialog, setManualDialog] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualScore, setManualScore] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Settings edit
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsRanges, setSettingsRanges] = useState<ScoreRange[]>([]);
  const [requirePlacement, setRequirePlacement] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery<PlacementSettings>({
    queryKey: ["placement-settings"],
    queryFn: async () => {
      const r = await fetch(api("/api/placement/settings"), { credentials: "include" });
      return r.json();
    },
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery<PlacementAttempt[]>({
    queryKey: ["placement-attempts"],
    queryFn: async () => {
      const r = await fetch(api("/api/placement/attempts"), { credentials: "include" });
      return r.json();
    },
  });

  const { data: reports } = useQuery<ReportRow[]>({
    queryKey: ["placement-reports"],
    queryFn: async () => {
      const r = await fetch(api("/api/placement/reports"), { credentials: "include" });
      return r.json();
    },
    enabled: activeTab === "reports",
  });

  const assignMutation = useMutation({
    mutationFn: async ({ studentEmail, courseId, placementAttemptId }: { studentEmail: string; courseId: number; placementAttemptId: number }) => {
      const r = await fetch(api("/api/placement/assign"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail, courseId, placementAttemptId, assignmentType: "manual", notes: assignNotes }),
      });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => {
      toast({ title: "Course assigned", description: "Student will see their assigned course on the dashboard." });
      queryClient.invalidateQueries({ queryKey: ["placement-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["placement-reports"] });
      setAssignDialog({ open: false, attempt: null });
      setAssignCourseId("");
      setAssignNotes("");
    },
    onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
  });

  const manualMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(api("/api/placement/manual-score"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: manualEmail, score: parseInt(manualScore, 10), notes: manualNotes }),
      });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => {
      toast({ title: "Score added" });
      queryClient.invalidateQueries({ queryKey: ["placement-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["placement-reports"] });
      setManualDialog(false);
      setManualEmail(""); setManualScore(""); setManualNotes("");
    },
    onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(api(`/api/placement/attempts/${id}`), { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      toast({ title: "Record deleted" });
      queryClient.invalidateQueries({ queryKey: ["placement-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["placement-reports"] });
      setDeleteId(null);
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(api("/api/placement/settings"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreRanges: settingsRanges, requirePlacementTest: requirePlacement }),
      });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => {
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: ["placement-settings"] });
      setEditingSettings(false);
    },
    onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
  });

  function openSettings() {
    setSettingsRanges(settings?.scoreRanges ?? []);
    setRequirePlacement(settings?.requirePlacementTest ?? false);
    setEditingSettings(true);
  }

  function handleAssign() {
    if (!assignDialog.attempt || !assignCourseId) return;
    assignMutation.mutate({
      studentEmail: assignDialog.attempt.studentEmail,
      courseId: parseInt(assignCourseId, 10),
      placementAttemptId: assignDialog.attempt.id,
    });
  }

  function exportCSV() {
    if (!reports) return;
    const headers = ["Name", "Email", "Score", "Level", "Recommended Course", "Assigned Course", "Progress %", "Status", "Date"];
    const rows = reports.map((r) => [
      r.studentName, r.studentEmail, r.placementScore, r.level,
      r.recommendedCourse, r.assignedCourse, r.progressPercent, r.completionStatus,
      new Date(r.takenAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "placement-report.csv";
    a.click();
  }

  const totalAssessed = attempts?.length ?? 0;
  const pendingAssignment = attempts?.filter((a) => !a.assignedCourseId).length ?? 0;
  const assigned = attempts?.filter((a) => !!a.assignedCourseId).length ?? 0;
  const levelCounts = attempts?.reduce<Record<string, number>>((acc, a) => { acc[a.level] = (acc[a.level] ?? 0) + 1; return acc; }, {}) ?? {};

  return (
    <>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Placement Results</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage student placement assessments and course assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openSettings}>Configure Score Ranges</Button>
            <Button size="sm" onClick={() => setManualDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" />Add Manual Score
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
                <div><div className="text-2xl font-bold">{totalAssessed}</div><div className="text-xs text-slate-500">Total Assessed</div></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
                <div><div className="text-2xl font-bold">{pendingAssignment}</div><div className="text-xs text-slate-500">Awaiting Assignment</div></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
                <div><div className="text-2xl font-bold">{assigned}</div><div className="text-xs text-slate-500">Assigned</div></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-wrap gap-1.5 pt-1">
                {Object.entries(levelCounts).map(([lvl, count]) => (
                  <span key={lvl} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${LEVEL_COLORS[lvl] ?? ""}`}>
                    {lvl}: {count}
                  </span>
                ))}
                {Object.keys(levelCounts).length === 0 && <span className="text-xs text-slate-400">No data yet</span>}
              </div>
              <div className="text-xs text-slate-400 mt-1">Level distribution</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="results">Assessment Results</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-4">
            {attemptsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : !attempts || attempts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No placement results yet</p>
                  <p className="text-slate-400 text-sm mt-1">Students will appear here after taking the placement test.</p>
                  <Button size="sm" className="mt-4" onClick={() => setManualDialog(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />Add Manual Score
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border bg-white dark:bg-slate-900 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Student</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Score</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Level</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Recommended Course</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Assigned Course</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attempts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{a.studentName}</div>
                          <div className="text-xs text-slate-400">{a.studentEmail}</div>
                          {a.source === "manual" && <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1">manual</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${a.score}%` }} />
                            </div>
                            <span className="font-semibold">{a.score}</span>
                            <span className="text-slate-400">/{a.maxScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><LevelBadge level={a.level} /></td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {a.recommendedCourseTitle ?? <span className="text-slate-400 italic text-xs">Not mapped</span>}
                        </td>
                        <td className="px-4 py-3">
                          {a.assignedCourseTitle ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3" />{a.assignedCourseTitle}
                            </span>
                          ) : (
                            <span className="text-amber-600 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(a.takenAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => { setAssignDialog({ open: true, attempt: a }); setAssignCourseId(a.assignedCourseId?.toString() ?? ""); }}>
                              {a.assignedCourseId ? <Pencil className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}
                              {a.assignedCourseId ? "Change" : "Assign"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteId(a.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!reports?.length}>
                <Download className="w-4 h-4 mr-1.5" />Export CSV
              </Button>
            </div>
            {!reports ? (
              <div className="text-center py-12 text-slate-400">Loading reports...</div>
            ) : reports.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-slate-400">No data available yet</CardContent></Card>
            ) : (
              <div className="rounded-lg border bg-white dark:bg-slate-900 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800">
                      {["Student", "Email", "Score", "Level", "Recommended", "Assigned", "Progress", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium">{r.studentName}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{r.studentEmail}</td>
                        <td className="px-4 py-3 font-semibold">{r.placementScore}</td>
                        <td className="px-4 py-3"><LevelBadge level={r.level} /></td>
                        <td className="px-4 py-3 text-slate-600">{r.recommendedCourse}</td>
                        <td className="px-4 py-3 text-slate-600">{r.assignedCourse}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.progressPercent}%` }} />
                            </div>
                            <span className="text-xs">{r.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.completionStatus === "Completed" ? "bg-emerald-50 text-emerald-700" : r.completionStatus === "In Progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                            {r.completionStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.takenAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Course Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(o) => !o && setAssignDialog({ open: false, attempt: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Course</DialogTitle>
          </DialogHeader>
          {assignDialog.attempt && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                <div className="font-medium">{assignDialog.attempt.studentName}</div>
                <div className="text-slate-500">{assignDialog.attempt.studentEmail}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500">Score: <strong>{assignDialog.attempt.score}/100</strong></span>
                  <LevelBadge level={assignDialog.attempt.level} />
                </div>
                {assignDialog.attempt.recommendedCourseTitle && (
                  <div className="text-xs text-blue-600 mt-1">Recommended: {assignDialog.attempt.recommendedCourseTitle}</div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Select Course</Label>
                <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {settings?.courses?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea value={assignNotes} onChange={(e) => setAssignNotes((e.target as HTMLTextAreaElement).value)} placeholder="Internal notes..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, attempt: null })}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignCourseId || assignMutation.isPending}>
              {assignMutation.isPending ? "Assigning..." : "Assign Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Score Dialog */}
      <Dialog open={manualDialog} onOpenChange={setManualDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Manual Score</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Student Email</Label>
              <Input value={manualEmail} onChange={(e) => setManualEmail((e.target as HTMLInputElement).value)} placeholder="student@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Score (0–100)</Label>
              <Input type="number" min={0} max={100} value={manualScore} onChange={(e) => setManualScore((e.target as HTMLInputElement).value)} placeholder="e.g. 55" />
              {manualScore && settings?.scoreRanges && (
                <div className="text-xs text-slate-500">
                  → Level: <LevelBadge level={settings.scoreRanges.find((r) => parseInt(manualScore) >= r.min && parseInt(manualScore) <= r.max)?.level ?? "?"} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={manualNotes} onChange={(e) => setManualNotes((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="e.g. from in-person interview" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog(false)}>Cancel</Button>
            <Button onClick={() => manualMutation.mutate()} disabled={!manualEmail || !manualScore || manualMutation.isPending}>
              {manualMutation.isPending ? "Adding..." : "Add Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Range Settings */}
      <Dialog open={editingSettings} onOpenChange={setEditingSettings}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Configure Score Ranges & Course Mapping</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            <div className="flex items-center gap-3 pb-2 border-b">
              <input type="checkbox" id="rpt" checked={requirePlacement} onChange={(e) => setRequirePlacement((e.target as HTMLInputElement).checked)} className="rounded" />
              <Label htmlFor="rpt">Require placement test before students can access courses</Label>
            </div>
            {settingsRanges.map((r, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded p-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${LEVEL_COLORS[r.level] ?? ""}`}>{r.level}</span>
                <Input type="number" className="w-20 h-7 text-xs" value={r.min} onChange={(e) => {
                  const v = [...settingsRanges]; v[i] = { ...v[i], min: parseInt((e.target as HTMLInputElement).value) || 0 }; setSettingsRanges(v);
                }} />
                <span className="text-xs text-slate-400">to</span>
                <Input type="number" className="w-20 h-7 text-xs" value={r.max} onChange={(e) => {
                  const v = [...settingsRanges]; v[i] = { ...v[i], max: parseInt((e.target as HTMLInputElement).value) || 0 }; setSettingsRanges(v);
                }} />
                <span className="text-xs text-slate-400">→</span>
                <Select value={r.courseId ? String(r.courseId) : "none"} onValueChange={(val) => {
                  const v = [...settingsRanges]; v[i] = { ...v[i], courseId: val === "none" ? null : parseInt(val) }; setSettingsRanges(v);
                }}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="No course mapped" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No course mapped</SelectItem>
                    {settings?.courses?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSettings(false)}>Cancel</Button>
            <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete placement record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this student's placement result. Course assignments will not be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
