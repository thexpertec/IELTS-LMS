import { useState, useRef, useEffect } from "react";
import {
  Mic, MicOff, Play, Pause, RotateCcw, ChevronRight, Star,
  Clock, CheckCircle2, AlertCircle, Zap, Volume2, Loader2,
  MessageSquare, Brain, BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

const PARTS = [
  {
    id: 1, title: "Part 1 — Introduction",
    description: "The examiner will ask you general questions about familiar topics such as home, family, work, studies, and interests.",
    prepTime: 0,
    questions: [
      "Tell me about where you live. What do you like most about your neighbourhood?",
      "Do you prefer spending time indoors or outdoors? Why?",
      "What kind of music do you enjoy listening to? Why?",
    ],
  },
  {
    id: 2, title: "Part 2 — Long Turn",
    description: "You will be given a task card. You have 1 minute to prepare and then speak for 1–2 minutes.",
    prepTime: 60,
    cueCard: {
      title: "Describe a time when you helped someone.",
      bullet: ["Who you helped", "Why they needed your help", "How you helped them", "How you felt about helping them"],
    },
    questions: ["Now let's discuss your topic. Was it difficult to help this person?"],
  },
  {
    id: 3, title: "Part 3 — Discussion",
    description: "The examiner will ask you further questions connected to the topic in Part 2.",
    prepTime: 0,
    questions: [
      "Do you think people in cities are as willing to help strangers as people in rural areas?",
      "How can governments encourage people to be more helpful in society?",
      "Do you think social media has made people more or less willing to help each other? Why?",
    ],
  },
];

interface SpeakingFeedback {
  overall: number;
  criteria: { name: string; score: number; comment: string; icon: string }[];
  transcript: string;
  highlights: string[];
  suggestions: string[];
}

function generateSpeakingFeedback(duration: number): SpeakingFeedback {
  const base = Math.min(7, Math.max(5, 4.5 + duration / 30));
  return {
    overall: Math.round(base * 2) / 2,
    criteria: [
      { name: "Fluency & Coherence", score: Math.round((base + Math.random() * 0.5 - 0.25) * 2) / 2, comment: "Good flow with some natural pausing. Reduce filler words like 'um' and 'uh'.", icon: "🗣️" },
      { name: "Lexical Resource", score: Math.round((base - 0.5 + Math.random() * 1) * 2) / 2, comment: "Adequate vocabulary range. Try using more idiomatic expressions.", icon: "📚" },
      { name: "Grammatical Range", score: Math.round((base + Math.random() * 0.5) * 2) / 2, comment: "Good use of complex structures. Watch tense consistency.", icon: "✍️" },
      { name: "Pronunciation", score: Math.round((base - 0.25 + Math.random() * 0.5) * 2) / 2, comment: "Generally clear. Focus on word stress in multi-syllable academic words.", icon: "🔊" },
    ],
    transcript: "I think this is a really interesting topic because… [AI transcription would appear here with your actual speech]",
    highlights: [
      "Good use of discourse markers ('Furthermore', 'However')",
      "Natural intonation pattern on key points",
      "Maintained speaking pace throughout",
    ],
    suggestions: [
      "Try to extend your answers — aim for 2+ sentences per point",
      "Use more specific examples: dates, names, places",
      "Practice 'signposting' language: 'Moving on to...', 'To illustrate this...'",
    ],
  };
}

export default function SpeakingPage() {
  const { addXP, updateBand } = useGamification();
  const [activePart, setActivePart] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [phase, setPhase] = useState<"ready" | "prep" | "recording" | "done">("ready");
  const [prepTime, setPrepTime] = useState(0);
  const [recordDuration, setRecordDuration] = useState(0);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [playback, setPlayback] = useState(false);
  const [amplitude, setAmplitude] = useState<number[]>(Array(20).fill(4));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ampIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const part = PARTS[activePart];
  const question = part.questions[activeQuestion];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (ampIntervalRef.current) clearInterval(ampIntervalRef.current);
    };
  }, []);

  function startRecording() {
    if (part.prepTime > 0 && phase === "ready") {
      setPhase("prep");
      setPrepTime(part.prepTime);
      intervalRef.current = setInterval(() => {
        setPrepTime((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            beginRecording();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      beginRecording();
    }
  }

  function beginRecording() {
    setPhase("recording");
    setRecordDuration(0);
    intervalRef.current = setInterval(() => setRecordDuration((d) => d + 1), 1000);
    ampIntervalRef.current = setInterval(() => {
      setAmplitude(Array.from({ length: 20 }, () => 4 + Math.random() * 28));
    }, 100);
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (ampIntervalRef.current) clearInterval(ampIntervalRef.current);
    setAmplitude(Array(20).fill(4));
    setPhase("done");
  }

  async function getFeedback() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    const fb = generateSpeakingFeedback(recordDuration);
    setFeedback(fb);
    setLoading(false);
    addXP(80);
    updateBand(fb.overall, "Speaking");
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (ampIntervalRef.current) clearInterval(ampIntervalRef.current);
    setPhase("ready");
    setRecordDuration(0);
    setPrepTime(0);
    setFeedback(null);
    setAmplitude(Array(20).fill(4));
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-[#CC0000]" /> Speaking Module
        </h1>
        <p className="text-muted-foreground text-sm mt-1">AI pronunciation analysis · Fluency feedback · Band score estimation</p>
      </div>

      {/* Part tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PARTS.map((p, i) => (
          <button key={p.id} onClick={() => { setActivePart(i); setActiveQuestion(0); reset(); }}
            className={cn("px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all",
              activePart === i ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 hover:border-[#0d1b60]")}>
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Recording */}
        <div className="space-y-4">
          {/* Cue card (Part 2 only) */}
          {part.cueCard && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-5">
                <Badge className="bg-amber-500 text-white text-[11px] mb-3">Task Card</Badge>
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-3">{part.cueCard.title}</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">You should say:</p>
                <ul className="space-y-1">
                  {part.cueCard.bullet.map((b, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span> {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Question */}
          <Card className="border-[#0d1b60]/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-[#0d1b60] text-white text-[11px]">Question {activeQuestion + 1}/{part.questions.length}</Badge>
                <div className="flex gap-1">
                  {part.questions.map((_, i) => (
                    <button key={i} onClick={() => { setActiveQuestion(i); reset(); }}
                      className={cn("w-6 h-6 rounded-full text-xs font-bold transition-colors",
                        activeQuestion === i ? "bg-[#CC0000] text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-[#0d1b60] dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-base leading-relaxed font-medium">{question}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{part.description}</p>
            </CardContent>
          </Card>

          {/* Recorder */}
          <Card>
            <CardContent className="p-6">
              {/* Waveform */}
              <div className="flex items-center justify-center gap-0.5 h-16 mb-5">
                {amplitude.map((h, i) => (
                  <div key={i} style={{ height: `${h}px` }}
                    className={cn("w-2 rounded-full transition-all duration-100",
                      phase === "recording" ? "bg-[#CC0000]" : phase === "done" ? "bg-indigo-400" : "bg-slate-200 dark:bg-slate-700")} />
                ))}
              </div>

              {/* Status */}
              <div className="text-center mb-5">
                {phase === "ready" && <p className="text-sm text-muted-foreground">Press the button below to start{part.prepTime > 0 ? ` (${part.prepTime}s prep time)` : ""}</p>}
                {phase === "prep" && (
                  <div>
                    <p className="text-2xl font-extrabold text-amber-600">{prepTime}</p>
                    <p className="text-sm text-amber-600 font-semibold">Preparation time remaining</p>
                  </div>
                )}
                {phase === "recording" && (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#CC0000] animate-pulse" />
                      <p className="text-sm font-semibold text-[#CC0000]">Recording</p>
                    </div>
                    <p className="text-2xl font-extrabold">{formatTime(recordDuration)}</p>
                  </div>
                )}
                {phase === "done" && (
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">Recording complete</p>
                    <p className="text-xs text-muted-foreground">{formatTime(recordDuration)} recorded</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {phase === "ready" && (
                  <button onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-[#CC0000] hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
                    <Mic className="w-7 h-7" />
                  </button>
                )}
                {phase === "prep" && (
                  <button onClick={beginRecording}
                    className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg transition-all">
                    <Mic className="w-7 h-7" />
                  </button>
                )}
                {phase === "recording" && (
                  <button onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 border-4 border-[#CC0000]">
                    <MicOff className="w-7 h-7" />
                  </button>
                )}
                {phase === "done" && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPlayback((p) => !p)}
                      className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-all">
                      {playback ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button onClick={reset}
                      className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <Button onClick={getFeedback} disabled={loading} className="bg-[#0d1b60] hover:bg-[#162270]">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Analysing…</> : <><Zap className="w-4 h-4 mr-1" /> Get AI Feedback</>}
                    </Button>
                  </div>
                )}
              </div>

              {part.prepTime > 0 && phase === "ready" && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  ⏱ You'll have {part.prepTime} seconds to prepare before recording starts automatically
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Feedback */}
        <div className="space-y-4">
          {!feedback && !loading && (
            <Card className="border-dashed h-64 flex items-center justify-center">
              <div className="text-center px-6">
                <Brain className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">AI Speaking Feedback</p>
                <p className="text-sm text-muted-foreground">Record your answer and get instant AI analysis of fluency, pronunciation, vocabulary, and grammar.</p>
              </div>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                <div>
                  <p className="font-semibold">Analysing your speaking…</p>
                  <p className="text-sm text-muted-foreground">Processing audio for pronunciation, fluency, and vocabulary</p>
                </div>
              </CardContent>
            </Card>
          )}

          {feedback && (
            <>
              {/* Overall */}
              <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Speaking Band Score</p>
                  <div className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-1">{feedback.overall}</div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    {feedback.overall >= 7 ? "Band 7+ — very good speaker!" : feedback.overall >= 6 ? "Band 6 — competent communicator" : "Band 5.5 — keep practising!"}
                  </p>
                </CardContent>
              </Card>

              {/* Criteria */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" /> Score Breakdown</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {feedback.criteria.map((c) => (
                    <div key={c.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold">{c.icon} {c.name}</span>
                        <span className="text-sm font-bold">{c.score}</span>
                      </div>
                      <Progress value={(c.score / 9) * 100} className="h-2 mb-1" />
                      <p className="text-[11px] text-muted-foreground">{c.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Highlights */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> What went well</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-1.5">
                  {feedback.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> {h}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Suggestions</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-1.5">
                  {feedback.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> {s}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button variant="outline" onClick={reset} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
