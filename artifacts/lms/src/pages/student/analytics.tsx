import {
  BarChart2, TrendingUp, Target, AlertCircle, CheckCircle2,
  Calendar, Flame, Zap, Award, Clock, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, Cell, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

const BAND_HISTORY = [
  { week: "Apr W1", overall: 5.5, listening: 6.0, reading: 5.5, writing: 5.0, speaking: 5.5 },
  { week: "Apr W2", overall: 5.5, listening: 6.0, reading: 6.0, writing: 5.0, speaking: 5.5 },
  { week: "Apr W3", overall: 6.0, listening: 6.5, reading: 6.0, writing: 5.5, speaking: 6.0 },
  { week: "Apr W4", overall: 6.0, listening: 6.5, reading: 6.0, writing: 5.5, speaking: 6.0 },
  { week: "May W1", overall: 6.0, listening: 6.5, reading: 6.0, writing: 6.0, speaking: 6.0 },
  { week: "May W2", overall: 6.5, listening: 7.0, reading: 6.5, writing: 6.0, speaking: 6.5 },
];

const RADAR_DATA = [
  { subject: "Listening", score: 7.0, fullMark: 9 },
  { subject: "Reading", score: 6.5, fullMark: 9 },
  { subject: "Writing", score: 6.0, fullMark: 9 },
  { subject: "Speaking", score: 6.5, fullMark: 9 },
  { subject: "Vocabulary", score: 5.5, fullMark: 9 },
  { subject: "Grammar", score: 6.0, fullMark: 9 },
];

const WEEKLY_STUDY = [
  { day: "Mon", minutes: 45 }, { day: "Tue", minutes: 70 }, { day: "Wed", minutes: 30 },
  { day: "Thu", minutes: 90 }, { day: "Fri", minutes: 55 }, { day: "Sat", minutes: 120 }, { day: "Sun", minutes: 40 },
];

const WEAK_AREAS = [
  { area: "Writing Task 2 — Arguments", module: "Writing", band: 5.5, target: 7.0, tip: "Practice giving balanced opinions with specific examples. Aim for 3 well-developed body paragraphs." },
  { area: "Academic Vocabulary", module: "Vocabulary", band: 5.5, target: 7.0, tip: "Study 10 academic words daily. Focus on collocations and word families." },
  { area: "Reading — Matching Headings", module: "Reading", band: 6.0, target: 7.0, tip: "Read each paragraph's topic sentence first. Eliminate headings that are clearly wrong." },
];

const HEATMAP_WEEKS = 12;
const HEATMAP_DAYS = 7;
function generateHeatmap() {
  const data = [];
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const week = [];
    for (let d = 0; d < HEATMAP_DAYS; d++) {
      const isRecent = w >= HEATMAP_WEEKS - 2;
      const rand = Math.random();
      week.push(isRecent ? (rand > 0.2 ? Math.floor(rand * 90) + 15 : 0) : (rand > 0.45 ? Math.floor(rand * 60) + 10 : 0));
    }
    data.push(week);
  }
  return data;
}
const HEATMAP = generateHeatmap();

function intensityClass(mins: number) {
  if (mins === 0) return "bg-slate-100 dark:bg-slate-800";
  if (mins < 30) return "bg-indigo-200 dark:bg-indigo-900";
  if (mins < 60) return "bg-indigo-400 dark:bg-indigo-700";
  return "bg-indigo-600 dark:bg-indigo-500";
}

export default function AnalyticsPage() {
  const { streak, xp, level, totalStudyHours, targetBand, currentBand, weeklyXP } = useGamification();
  const weeklyTotal = weeklyXP.reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#CC0000]" /> Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your IELTS progress, identify weak areas, and stay on target for Band {targetBand}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Target className="w-5 h-5" />, label: "Current Band", value: currentBand.toFixed(1), sub: `Target: ${targetBand}`, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", progress: (currentBand / targetBand) * 100 },
          { icon: <Flame className="w-5 h-5" />, label: "Study Streak", value: `${streak} days`, sub: "Current streak", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", progress: Math.min(100, (streak / 30) * 100) },
          { icon: <Zap className="w-5 h-5" />, label: "XP This Week", value: weeklyTotal.toLocaleString(), sub: `Level ${level} · Total: ${xp.toLocaleString()}`, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", progress: Math.min(100, (weeklyTotal / 1000) * 100) },
          { icon: <Clock className="w-5 h-5" />, label: "Study Hours", value: `${totalStudyHours}h`, sub: "Total learning time", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", progress: Math.min(100, (totalStudyHours / 120) * 100) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 sm:p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                <span className={s.color}>{s.icon}</span>
              </div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground mb-2">{s.sub}</p>
              <Progress value={s.progress} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Band score trend */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Band Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={BAND_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[5, 9]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} ticks={[5, 5.5, 6, 6.5, 7, 7.5, 8]} width={30} />
                  <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
                  <Line type="monotone" dataKey="overall" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: "#4f46e5" }} name="Overall" />
                  <Line type="monotone" dataKey="listening" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Listening" />
                  <Line type="monotone" dataKey="reading" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Reading" />
                  <Line type="monotone" dataKey="writing" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Writing" />
                  <Line type="monotone" dataKey="speaking" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Speaking" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {[["Overall","#4f46e5"],["Listening","#0ea5e9"],["Reading","#10b981"],["Writing","#f59e0b"],["Speaking","#ec4899"]].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Skill Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RADAR_DATA} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Radar name="Score" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {RADAR_DATA.map((d) => (
                <div key={d.subject} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{d.subject}</span>
                  <Progress value={(d.score / 9) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs font-bold w-8 text-right">{d.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly study time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Daily Study Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={WEEKLY_STUDY} barCategoryGap="35%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} width={28} />
                <Tooltip formatter={(v) => [`${v} min`, "Study time"]} contentStyle={{ borderRadius: "0.5rem", fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {WEEKLY_STUDY.map((d, i) => (
                    <Cell key={i} fill={d.minutes >= 60 ? "#4f46e5" : d.minutes >= 30 ? "#818cf8" : "#c7d2fe"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">Goal: 60 min/day · Avg: {Math.round(WEEKLY_STUDY.reduce((a, d) => a + d.minutes, 0) / 7)} min</p>
          </CardContent>
        </Card>

        {/* Study consistency heatmap */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Study Consistency (12 weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {HEATMAP.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((mins, di) => (
                      <div key={di} title={`${mins} min`}
                        className={cn("w-4 h-4 rounded-sm transition-colors", intensityClass(mins))} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                {["bg-slate-100 dark:bg-slate-800", "bg-indigo-200 dark:bg-indigo-900", "bg-indigo-400 dark:bg-indigo-700", "bg-indigo-600 dark:bg-indigo-500"].map((c, i) => (
                  <div key={i} className={cn("w-3 h-3 rounded-sm", c)} />
                ))}
                <span>More</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weak areas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Weak Areas & Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {WEAK_AREAS.map((w, i) => (
              <div key={i} className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{w.area}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{w.module}</Badge>
                  </div>
                  <span className="text-xl font-extrabold text-amber-700">{w.band}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Current: {w.band}</span>
                    <span>Target: {w.target}</span>
                  </div>
                  <Progress value={(w.band / w.target) * 100} className="h-2" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">💡 {w.tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
