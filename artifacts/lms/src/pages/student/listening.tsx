import { useState, useRef, useEffect } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, ChevronRight,
  CheckCircle2, Clock, Headphones, ChevronDown, Award, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

const SECTIONS = [
  {
    id: 1, title: "Section 1 — Conversation", duration: 498, difficulty: "Easy",
    context: "A student talking to a housing officer about accommodation options near a university.",
    transcript: [
      { time: 0, text: "Housing officer: Good morning! How can I help you today?" },
      { time: 5, text: "Student: Hi, I'm looking for accommodation near the campus." },
      { time: 10, text: "Housing officer: Of course. We have several options available. Are you looking for a single room or shared housing?" },
      { time: 16, text: "Student: I'd prefer a single room if possible. I need a quiet place to study." },
      { time: 22, text: "Housing officer: We have rooms in Maple Hall — that's our quietest student residence. It's about 10 minutes' walk from the main building." },
      { time: 30, text: "Student: That sounds perfect. What's the weekly rent?" },
      { time: 34, text: "Housing officer: It's £145 per week, which includes electricity and internet." },
      { time: 40, text: "Student: Is breakfast included as well?" },
      { time: 44, text: "Housing officer: No, the kitchen facilities are shared, so you would cook your own meals." },
    ],
    questions: [
      { id: 1, type: "mcq", text: "What type of accommodation is the student looking for?", options: ["Shared house", "Single room", "Double room", "Studio apartment"], answer: 1 },
      { id: 2, type: "mcq", text: "How far is Maple Hall from the main building?", options: ["5 minutes' walk", "10 minutes' walk", "15 minutes' walk", "20 minutes' walk"], answer: 1 },
      { id: 3, type: "fill", text: "The weekly rent is £_____ and includes electricity and internet.", answer: "145" },
      { id: 4, type: "mcq", text: "Which of the following is NOT included in the rent?", options: ["Electricity", "Internet", "Breakfast", "All of the above"], answer: 2 },
    ],
  },
  {
    id: 2, title: "Section 2 — Monologue", duration: 612, difficulty: "Medium",
    context: "A tour guide describing the history and features of a new community library.",
    transcript: [
      { time: 0, text: "Welcome everyone to the Grand Opening of the Westfield Community Library." },
      { time: 5, text: "This stunning building was designed by award-winning architect Elena Rossi." },
      { time: 11, text: "Construction began in March 2023 and was completed in just 18 months." },
      { time: 18, text: "The library spans three floors, with over 40,000 books and an extensive digital archive." },
      { time: 26, text: "On the ground floor you'll find the children's section, the information desk, and our café." },
    ],
    questions: [
      { id: 5, type: "mcq", text: "Who designed the Westfield Community Library?", options: ["James Harrington", "Elena Rossi", "Maria Chen", "David Park"], answer: 1 },
      { id: 6, type: "fill", text: "Construction took _____ months to complete.", answer: "18" },
      { id: 7, type: "mcq", text: "How many books does the library contain?", options: ["Over 30,000", "Over 40,000", "Over 50,000", "Over 60,000"], answer: 1 },
    ],
  },
];

export default function ListeningPage() {
  const { addXP } = useGamification();
  const [activeSection, setActiveSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const section = SECTIONS[activeSection];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= section.duration) { setIsPlaying(false); return section.duration; }
          return t + 1;
        });
      }, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, section.duration]);

  const activeTranscript = section.transcript.filter((t) => t.time <= currentTime);

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function handleSubmit() {
    let correct = 0;
    section.questions.forEach((q) => {
      const ans = answers[q.id];
      if (q.type === "mcq" && ans === q.answer) correct++;
      if (q.type === "fill" && String(ans).toLowerCase().trim() === String(q.answer).toLowerCase()) correct++;
    });
    const pct = Math.round((correct / section.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    addXP(correct * 20);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-6 h-6 text-[#CC0000]" /> Listening Practice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">IELTS Academic — 4 Sections · 40 Questions · 30 Minutes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> 30:00</Badge>
          <Badge className="bg-indigo-600 text-white">Section {section.id}/4</Badge>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => { setActiveSection(i); setCurrentTime(0); setIsPlaying(false); setSubmitted(false); setAnswers({}); setScore(null); }}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
              activeSection === i ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "bg-white dark:bg-gray-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0d1b60]")}>
            {s.title}
            <Badge variant="outline" className={cn("text-[10px] h-5", s.difficulty === "Easy" ? "border-green-400 text-green-600" : s.difficulty === "Medium" ? "border-amber-400 text-amber-600" : "border-red-400 text-red-600")}>
              {s.difficulty}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Player + Transcript */}
        <div className="lg:col-span-1 space-y-4">
          {/* Context */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Context</p>
              <p className="text-sm leading-relaxed">{section.context}</p>
            </CardContent>
          </Card>

          {/* Audio player */}
          <Card className="border-[#0d1b60]/20">
            <CardContent className="p-5">
              {/* Waveform visualizer */}
              <div className="flex items-end gap-0.5 h-12 mb-4 px-2">
                {Array.from({ length: 48 }).map((_, i) => {
                  const progress = currentTime / section.duration;
                  const barProgress = i / 48;
                  const height = 8 + Math.sin(i * 0.7) * 12 + Math.sin(i * 1.3) * 8 + 12;
                  return (
                    <div key={i}
                      style={{ height: `${height}px` }}
                      className={cn("flex-1 rounded-full transition-colors",
                        barProgress <= progress ? "bg-[#CC0000]" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <input type="range" min={0} max={section.duration} value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="w-full h-1.5 accent-[#CC0000] cursor-pointer" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(section.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <button onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => setIsPlaying((p) => !p)}
                  className="w-12 h-12 rounded-full bg-[#CC0000] hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={() => setCurrentTime(Math.min(section.duration, currentTime + 10))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume + Speed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-1.5 accent-[#0d1b60] cursor-pointer" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Speed</span>
                  <div className="flex gap-1">
                    {[0.75, 1.0, 1.25, 1.5].map((s) => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className={cn("px-2 py-0.5 rounded text-[11px] font-semibold transition-colors",
                          speed === s ? "bg-[#0d1b60] text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTranscript(!showTranscript)}>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Transcript {isPlaying ? "(live)" : ""}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showTranscript && "rotate-180")} />
              </CardTitle>
            </CardHeader>
            {showTranscript && (
              <CardContent className="pt-0 max-h-48 overflow-y-auto space-y-2">
                {activeTranscript.map((t, i) => (
                  <p key={i} className={cn("text-sm leading-relaxed p-1.5 rounded", i === activeTranscript.length - 1 && isPlaying && "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 font-medium")}>
                    <span className="text-[10px] text-muted-foreground mr-2">{formatTime(t.time)}</span>
                    {t.text}
                  </p>
                ))}
                {activeTranscript.length === 0 && <p className="text-sm text-muted-foreground">Press play to see transcript...</p>}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right: Questions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Questions {section.questions[0].id}–{section.questions[section.questions.length - 1].id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((q, qi) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCorrect = submitted && (q.type === "mcq" ? answers[q.id] === q.answer : String(answers[q.id]).toLowerCase().trim() === String(q.answer).toLowerCase());
                return (
                  <div key={q.id} className={cn("p-4 rounded-xl border transition-colors",
                    submitted ? isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-rose-50 dark:bg-rose-950/20 border-rose-200"
                    : isAnswered ? "border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-700")}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-6 h-6 rounded-full bg-[#0d1b60] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{qi + 1}</span>
                      <p className="text-sm font-medium leading-relaxed">{q.text}</p>
                    </div>

                    {q.type === "mcq" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                        {q.options!.map((opt, oi) => (
                          <button key={oi} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                            className={cn("text-left text-sm px-3 py-2 rounded-lg border transition-all",
                              submitted
                                ? oi === q.answer ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-semibold"
                                  : answers[q.id] === oi ? "bg-rose-100 border-rose-400 text-rose-800"
                                  : "border-slate-200 text-slate-500"
                                : answers[q.id] === oi ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === "fill" && (
                      <div className="ml-9">
                        <input type="text" placeholder="Type your answer..." disabled={submitted}
                          value={String(answers[q.id] ?? "")}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className={cn("w-full max-w-xs px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all",
                            submitted ? isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-rose-400 bg-rose-50 text-rose-800" : "border-slate-200 dark:border-slate-700 dark:bg-slate-900")} />
                        {submitted && !isCorrect && <p className="text-xs text-emerald-600 mt-1 font-semibold">✓ Correct answer: {q.answer}</p>}
                      </div>
                    )}
                  </div>
                );
              })}

              {!submitted ? (
                <Button onClick={handleSubmit} className="w-full bg-[#0d1b60] hover:bg-[#162270]">
                  Submit Answers <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <div className={cn("p-5 rounded-xl text-center border-2", score! >= 70 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300" : "bg-amber-50 dark:bg-amber-950/20 border-amber-300")}>
                  <div className="text-4xl font-extrabold mb-1">{score}%</div>
                  <p className="font-semibold text-sm mb-1">{score! >= 80 ? "Excellent!" : score! >= 60 ? "Good work!" : "Keep practising!"}</p>
                  <p className="text-xs text-muted-foreground mb-3">+{Math.floor(score! / 5) * 5} XP earned</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setAnswers({}); setScore(null); setCurrentTime(0); }}>Try Again</Button>
                    {activeSection < SECTIONS.length - 1 && (
                      <Button size="sm" className="bg-[#0d1b60]" onClick={() => { setActiveSection(i => i + 1); setSubmitted(false); setAnswers({}); setScore(null); setCurrentTime(0); }}>
                        Next Section <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
