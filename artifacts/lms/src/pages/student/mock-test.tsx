import { useState } from "react";
import {
  Timer, Play, ChevronRight, CheckCircle2, AlertCircle,
  BarChart2, Award, Clock, BookOpen, Headphones, PenLine,
  Mic, Star, ArrowLeft, X, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

interface TestResult {
  overall: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  totalTime: number;
  answers: number;
  correct: number;
}

const MOCK_TESTS = [
  { id: 1, title: "IELTS Academic — Full Mock Test 1", type: "Academic", duration: 165, sections: 4, difficulty: "Band 6–7", status: "available", date: "Available now" },
  { id: 2, title: "IELTS Academic — Full Mock Test 2", type: "Academic", duration: 165, sections: 4, difficulty: "Band 7+", status: "completed", date: "Completed May 9, 2026", score: 6.5 },
  { id: 3, title: "IELTS General Training — Mock Test 1", type: "General", duration: 165, sections: 4, difficulty: "Band 6", status: "available", date: "Available now" },
  { id: 4, title: "Listening Only — 30 min Practice", type: "Section", duration: 30, sections: 1, difficulty: "Mixed", status: "available", date: "Available now" },
  { id: 5, title: "Writing Task 2 — Timed Practice", type: "Section", duration: 40, sections: 1, difficulty: "Band 6–7", status: "available", date: "Available now" },
];

const SAMPLE_QUESTIONS = [
  { id: 1, section: "Listening", text: "What time does the library close on Fridays?", options: ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"], answer: 2 },
  { id: 2, section: "Listening", text: "The woman is looking for accommodation near:", options: ["The train station", "The university", "The hospital", "The shopping centre"], answer: 1 },
  { id: 3, section: "Reading", text: "According to the passage, the coffee plant originated in:", options: ["Yemen", "Ethiopia", "Brazil", "India"], answer: 1 },
  { id: 4, section: "Reading", text: "The word 'proliferate' in paragraph 3 is closest in meaning to:", options: ["Decrease", "Multiply rapidly", "Improve", "Spread slowly"], answer: 1 },
  { id: 5, section: "Reading", text: "The author's main purpose in writing this text is to:", options: ["Persuade the reader", "Entertain", "Describe a process", "Inform about a topic"], answer: 3 },
];

type Phase = "list" | "instructions" | "test" | "results";

export default function MockTestPage() {
  const { addXP, updateBand } = useGamification();
  const [phase, setPhase] = useState<Phase>("list");
  const [selectedTest, setSelectedTest] = useState<typeof MOCK_TESTS[0] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  function startTest(test: typeof MOCK_TESTS[0]) {
    setSelectedTest(test);
    setPhase("instructions");
    setTimeLeft(test.duration * 60);
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
  }

  async function submitTest() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2500));

    let correct = 0;
    SAMPLE_QUESTIONS.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
    const score = Math.min(9, Math.max(5, 4.5 + (correct / SAMPLE_QUESTIONS.length) * 4));
    const band = Math.round(score * 2) / 2;

    const r: TestResult = {
      overall: band,
      listening: Math.round((band + 0.5) * 2) / 2,
      reading: Math.round((band - 0.5 + Math.random()) * 2) / 2,
      writing: Math.round((band - 0.5) * 2) / 2,
      speaking: Math.round((band + Math.random() * 0.5) * 2) / 2,
      totalTime: (selectedTest?.duration ?? 165) * 60 - timeLeft,
      answers: SAMPLE_QUESTIONS.length,
      correct,
    };
    setResult(r);
    setPhase("results");
    setLoading(false);
    addXP(150);
    updateBand(r.overall, "Mock Test");
  }

  function formatTime(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
  }

  /* ── LIST ── */
  if (phase === "list") return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Timer className="w-6 h-6 text-[#CC0000]" /> Mock Test Engine
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Simulate real IELTS exam conditions with timed full tests and auto-result generation</p>
      </div>

      <div className="grid gap-4">
        {MOCK_TESTS.map((test) => (
          <Card key={test.id} className={cn("transition-all hover:shadow-md", test.status === "completed" && "border-emerald-200 dark:border-emerald-800")}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    test.type === "Academic" ? "bg-indigo-100 dark:bg-indigo-950/40" : test.type === "General" ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-amber-100 dark:bg-amber-950/40")}>
                    {test.sections === 4 ? <BookOpen className={cn("w-5 h-5", test.type === "Academic" ? "text-indigo-600" : "text-emerald-600")} />
                      : test.title.includes("Listening") ? <Headphones className="w-5 h-5 text-amber-600" />
                      : <PenLine className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <p className="font-bold text-sm">{test.title}</p>
                      {test.status === "completed" && <Badge className="bg-emerald-500 text-white text-[10px]">Completed</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{test.duration} min</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{test.sections} section{test.sections > 1 ? "s" : ""}</span>
                      <Badge variant="outline" className="text-[10px]">{test.difficulty}</Badge>
                      <span className="text-slate-400">{test.date}</span>
                    </div>
                    {test.score && <div className="mt-1 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-sm font-bold text-amber-600">Band {test.score}</span></div>}
                  </div>
                </div>
                <Button
                  onClick={() => startTest(test)}
                  className={cn("shrink-0", test.status === "completed" ? "bg-slate-600 hover:bg-slate-700" : "bg-[#0d1b60] hover:bg-[#162270]")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {test.status === "completed" ? "Retake Test" : "Start Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  /* ── INSTRUCTIONS ── */
  if (phase === "instructions" && selectedTest) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => setPhase("list")} className="mb-6 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to tests
      </Button>
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Badge className="bg-[#0d1b60] text-white mb-3">{selectedTest.type}</Badge>
            <h2 className="text-xl font-extrabold mb-2">{selectedTest.title}</h2>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedTest.duration} minutes</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{selectedTest.sections} sections</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="font-bold text-sm">Instructions:</h3>
            {[
              "Find a quiet place with no interruptions",
              "The timer will start as soon as you click Begin",
              "Read each question carefully before answering",
              "You cannot pause the test once started",
              "Submit your answers before the timer runs out",
              "Your results will be shown immediately after submission",
            ].map((inst, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" /> {inst}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Sections", value: `${selectedTest.sections}` },
              { label: "Time allowed", value: `${selectedTest.duration} min` },
              { label: "Difficulty", value: selectedTest.difficulty },
              { label: "Type", value: selectedTest.type },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold text-sm">{s.value}</p>
              </div>
            ))}
          </div>

          <Button onClick={() => setPhase("test")} className="w-full bg-[#CC0000] hover:bg-red-700 py-3 font-bold text-base">
            <Play className="w-4 h-4 mr-2 fill-white" /> Begin Test
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  /* ── TEST ── */
  if (phase === "test") {
    const q = SAMPLE_QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100;
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Test header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0d1b60] text-white">{q.section}</Badge>
            <span className="text-sm text-muted-foreground">Q{currentQuestion + 1} of {SAMPLE_QUESTIONS.length}</span>
          </div>
          <Badge variant={timeLeft < 600 ? "destructive" : "outline"} className="gap-1 text-sm font-mono">
            <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
          </Badge>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question navigation */}
        <div className="flex gap-1.5 flex-wrap">
          {SAMPLE_QUESTIONS.map((_, i) => (
            <button key={i} onClick={() => setCurrentQuestion(i)}
              className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                currentQuestion === i ? "bg-[#0d1b60] text-white"
                  : answers[i] !== undefined ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600")}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">{q.section} — Question {currentQuestion + 1}</p>
              <p className="text-base font-medium leading-relaxed">{q.text}</p>
            </div>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => setAnswers({ ...answers, [currentQuestion]: oi })}
                  className={cn("text-left text-sm px-4 py-3 rounded-xl border transition-all",
                    answers[currentQuestion] === oi ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                  <span className="font-bold mr-3">{String.fromCharCode(65 + oi)}.</span>{opt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))} disabled={currentQuestion === 0}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="flex gap-2">
            {currentQuestion < SAMPLE_QUESTIONS.length - 1 ? (
              <Button onClick={() => setCurrentQuestion((q) => q + 1)} className="bg-[#0d1b60]">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submitTest} disabled={loading} className="bg-[#CC0000] hover:bg-red-700">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Submitting…</> : "Submit Test"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULTS ── */
  if (phase === "results" && result) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center mx-auto mb-4">
          <Award className="w-9 h-9 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-extrabold mb-1">Test Complete!</h2>
        <p className="text-muted-foreground text-sm">Here's your estimated IELTS band score</p>
      </div>

      <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 text-center">
        <CardContent className="py-8">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Overall Band Score</p>
          <p className="text-7xl font-extrabold text-indigo-700 dark:text-indigo-300">{result.overall}</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
            {result.overall >= 7 ? "Band 7+ achieved! Excellent!" : result.overall >= 6 ? "Band 6 — good performance" : "Keep practising!"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Listening", score: result.listening, icon: <Headphones className="w-4 h-4" />, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/30" },
          { label: "Reading", score: result.reading, icon: <BookOpen className="w-4 h-4" />, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Writing", score: result.writing, icon: <PenLine className="w-4 h-4" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
          { label: "Speaking", score: result.speaking, icon: <Mic className="w-4 h-4" />, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.color.split(" ").slice(1).join(" "))}>
                <span className={s.color.split(" ")[0]}>{s.icon}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-extrabold">{s.score}</p>
              <Progress value={(s.score / 9) * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="font-bold text-lg">{result.correct}/{result.answers}</p><p className="text-muted-foreground text-xs">Correct</p></div>
            <div><p className="font-bold text-lg">{Math.round(result.correct / result.answers * 100)}%</p><p className="text-muted-foreground text-xs">Accuracy</p></div>
            <div><p className="font-bold text-lg">{formatTime(result.totalTime)}</p><p className="text-muted-foreground text-xs">Time used</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setPhase("list")} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to tests
        </Button>
        <Button onClick={() => startTest(selectedTest!)} className="flex-1 bg-[#0d1b60]">
          <Play className="w-4 h-4 mr-1" /> Retake test
        </Button>
      </div>
    </div>
  );

  return null;
}
