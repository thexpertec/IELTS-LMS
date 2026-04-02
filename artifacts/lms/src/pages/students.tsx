import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Phone, Mail, MapPin, GraduationCap, BookOpen,
  Users, Eye, Target, TrendingUp, ChevronUp, ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentRow = {
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  lastQualification: string | null;
  whyIelts: string | null;
  createdAt: string;
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  avgProgress: number;
};

type SortKey = "displayName" | "email" | "city" | "lastQualification" | "totalCourses" | "avgProgress";

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchAdminStudents(): Promise<StudentRow[]> {
  const res = await fetch("/api/admin/students");
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Cell({ value, fallback = "—" }: { value: string | null | undefined; fallback?: string }) {
  return <span>{value ?? fallback}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Students() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("displayName");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<StudentRow | null>(null);

  const { data: students = [], isLoading } = useQuery<StudentRow[]>({
    queryKey: ["admin-students"],
    queryFn: fetchAdminStudents,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = students.filter((s) =>
      s.displayName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").includes(q) ||
      (s.lastQualification ?? "").toLowerCase().includes(q)
    );

    rows.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "totalCourses") { av = a.totalCourses; bv = b.totalCourses; }
      else if (sortKey === "avgProgress") { av = a.avgProgress; bv = b.avgProgress; }
      else { av = (a[sortKey] ?? "").toLowerCase(); bv = (b[sortKey] ?? "").toLowerCase(); }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return rows;
  }, [students, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  }

  function Th({ label, k, className }: { label: string; k: SortKey; className?: string }) {
    return (
      <th
        className={cn(
          "px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors",
          className
        )}
        onClick={() => toggleSort(k)}
      >
        <span className="flex items-center gap-1">{label}<SortIcon k={k} /></span>
      </th>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
        <p className="text-muted-foreground mt-1">
          Detailed profiles of all learners — {isLoading ? "…" : students.length} registered students.
        </p>
      </div>

      {/* Stats row */}
      {!isLoading && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: students.length, icon: <Users className="w-4 h-4" />, color: "text-foreground" },
            { label: "Active Enrollments", value: students.reduce((s, r) => s + r.activeCourses, 0), icon: <BookOpen className="w-4 h-4" />, color: "text-blue-500" },
            { label: "Completions", value: students.reduce((s, r) => s + r.completedCourses, 0), icon: <GraduationCap className="w-4 h-4" />, color: "text-green-500" },
            {
              label: "Avg Progress",
              value: students.length ? Math.round(students.reduce((s, r) => s + r.avgProgress, 0) / students.length) + "%" : "—",
              icon: <TrendingUp className="w-4 h-4" />,
              color: "text-primary",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, city, phone…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-students"
          />
        </div>
        {search && (
          <span className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border rounded-xl bg-card/50 border-dashed">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No students found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="rounded-xl border shadow-sm bg-card overflow-auto">
          <table className="w-full text-sm border-collapse" data-testid="list-students">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                <Th label="Name" k="displayName" />
                <Th label="Email" k="email" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Phone</th>
                <Th label="City" k="city" />
                <Th label="Last Qualification" k="lastQualification" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Why IELTS?</th>
                <Th label="Courses" k="totalCourses" className="text-right" />
                <Th label="Progress" k="avgProgress" className="text-right" />
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, idx) => (
                <tr
                  key={student.email}
                  className={cn(
                    "border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer",
                    idx % 2 === 0 ? "bg-card" : "bg-muted/5"
                  )}
                  onClick={() => setSelected(student)}
                  data-testid={`card-student-${student.email}`}
                >
                  {/* Row number */}
                  <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>

                  {/* Name + avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <Avatar className="h-9 w-9 shrink-0 border">
                        {student.avatarUrl && <AvatarImage src={student.avatarUrl} alt={student.displayName} />}
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {initials(student.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate leading-tight">{student.displayName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Since {format(new Date(student.createdAt), "MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-muted-foreground min-w-[180px]">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </span>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 min-w-[120px]">
                    {student.phone ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3 h-3 shrink-0" />{student.phone}
                      </span>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </td>

                  {/* City */}
                  <td className="px-4 py-3 min-w-[110px]">
                    {student.city ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />{student.city}
                      </span>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </td>

                  {/* Last Qualification */}
                  <td className="px-4 py-3 min-w-[160px]">
                    {student.lastQualification
                      ? <Badge variant="secondary" className="text-[11px] font-medium">{student.lastQualification}</Badge>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>

                  {/* Why IELTS */}
                  <td className="px-4 py-3 max-w-[200px]">
                    {student.whyIelts
                      ? <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{student.whyIelts}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>

                  {/* Courses */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-semibold">{student.totalCourses}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {student.activeCourses} active · {student.completedCourses} done
                      </span>
                    </div>
                  </td>

                  {/* Avg progress */}
                  <td className="px-4 py-3 min-w-[100px]">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold">{student.avgProgress}%</span>
                      <Progress value={student.avgProgress} className="h-1.5 w-20 rounded-full" />
                    </div>
                  </td>

                  {/* View button */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); setSelected(student); }}
                    >
                      <Eye className="w-3 h-3" />View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Student Detail Drawer ── */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    {selected.avatarUrl && <AvatarImage src={selected.avatarUrl} alt={selected.displayName} />}
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {initials(selected.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">{selected.displayName}</SheetTitle>
                    <SheetDescription className="mt-0.5">
                      Member since {format(new Date(selected.createdAt), "MMMM d, yyyy")}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Courses", value: selected.totalCourses, color: "text-foreground" },
                  { label: "Active", value: selected.activeCourses, color: "text-blue-500" },
                  { label: "Done", value: selected.completedCourses, color: "text-green-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground font-medium">Overall Progress</span>
                  <span className="font-bold text-primary">{selected.avgProgress}%</span>
                </div>
                <Progress value={selected.avgProgress} className="h-2 rounded-full" />
              </div>

              <Separator className="my-5" />

              {/* Contact details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact & Location</h3>

                <ProfileField icon={<Mail className="w-4 h-4" />} label="Email" value={selected.email} />
                <ProfileField icon={<Phone className="w-4 h-4" />} label="Phone" value={selected.phone} />
                <ProfileField icon={<MapPin className="w-4 h-4" />} label="City" value={selected.city} />
              </div>

              <Separator className="my-5" />

              {/* Academic details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Academic Background</h3>

                <ProfileField
                  icon={<GraduationCap className="w-4 h-4" />}
                  label="Last Qualification"
                  value={selected.lastQualification}
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Target className="w-4 h-4" />
                    <span>Why doing IELTS?</span>
                  </div>
                  {selected.whyIelts
                    ? <p className="text-sm leading-relaxed pl-6">{selected.whyIelts}</p>
                    : <p className="text-sm text-muted-foreground/50 pl-6 italic">Not provided</p>}
                </div>

                {selected.bio && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <BookOpen className="w-4 h-4" />
                      <span>Bio</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">{selected.bio}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProfileField({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        {icon}<span>{label}</span>
      </div>
      <p className={cn("text-sm pl-6", !value && "text-muted-foreground/50 italic")}>
        {value ?? "Not provided"}
      </p>
    </div>
  );
}
