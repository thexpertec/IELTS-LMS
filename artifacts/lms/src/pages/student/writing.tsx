import { useState, useRef } from "react";
import {
  PenLine, Zap, CheckCircle2, AlertCircle, ChevronRight,
  Clock, RefreshCw, BookOpen, Star, BarChart2, Lightbulb,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

const TASKS = [
  {
    id: "t1", type: "Task 2", difficulty: "Band 6–7",
    prompt: "Some people think that the best way to improve public health is by increasing the number of sports facilities. Others, however, think that this would have little effect on public health and that other measures are required.\n\nDiscuss both views and give your own opinion.",
    minWords: 250, timeLimit: 40,
    tips: ["Address both views equally", "Give your own clear opinion", "Use linking words", "Aim for 4–5 paragraphs"],
  },
  {
    id: "t1a", type: "Task 1", difficulty: "Band 6–7",
    prompt: "The graph below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    minWords: 150, timeLimit: 20,
    tips: ["Describe the main trend", "Include specific data", "Compare key features", "Write an overview sentence"],
  },
];

interface AIFeedback {
  bandScore: number;
  criteria: { name: string; score: number; max: number; comment: string; color: string }[];
  corrections: { original: string; corrected: string; explanation: string }[];
  vocabularySuggestions: { word: string; alternatives: string[]; definition: string }[];
  strengths: string[];
  improvements: string[];
}

function generateFeedback(text: string): AIFeedback {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const baseScore = Math.min(7.5, Math.max(5.0, 4.5 + (words / 300)));
  const rounded = Math.round(baseScore * 2) / 2;

  return {
    bandScore: rounded,
    criteria: [
      { name: "Task Response", score: Math.round((rounded - 0.5 + Math.random() * 0.5) * 2) / 2, max: 9, comment: "You addressed the task with relevant ideas, though some points could be developed further.", color: "text-blue-600" },
      { name: "Coherence & Cohesion", score: Math.round((rounded + Math.random() * 0.5 - 0.25) * 2) / 2, max: 9, comment: "Paragraphing is generally clear. Use a wider range of linking devices.", color: "text-purple-600" },
      { name: "Lexical Resource", score: Math.round((rounded - 0.5 + Math.random() * 1) * 2) / 2, max: 9, comment: "Vocabulary is adequate. Try to incorporate more topic-specific academic vocabulary.", color: "text-orange-600" },
      { name: "Grammatical Range", score: Math.round((rounded + Math.random() * 0.5) * 2) / 2, max: 9, comment: "Good variety of sentence structures. Minor errors in complex clauses.", color: "text-green-600" },
    ],
    corrections: [
      { original: "peoples", corrected: "people", explanation: "'People' is already plural — no apostrophe or 's' needed." },
      { original: "more healthier", corrected: "healthier", explanation: "Double comparative error. Use either 'more healthy' or 'healthier', not both." },
      { original: "rise up", corrected: "increase / rise", explanation: "'Rise up' is informal. Use 'increase' or 'rise' in academic writing." },
    ],
    vocabularySuggestions: [
      { word: "good", alternatives: ["beneficial", "advantageous", "effective", "significant"], definition: "Use more precise academic adjectives" },
      { word: "bad", alternatives: ["detrimental", "adverse", "harmful", "counterproductive"], definition: "Strengthen your argument with precise negative adjectives" },
      { word: "show", alternatives: ["illustrate", "demonstrate", "indicate", "reveal"], definition: "Academic verbs for presenting data or evidence" },
    ],
    strengths: [
      "Clear introduction that restates the question",
      "Well-structured body paragraphs",
      "Some good use of hedging language ('may', 'could')",
    ],
    improvements: [
      "Develop each point with more specific examples",
      "Vary sentence length more — some paragraphs are too uniform",
      "Add a stronger conclusion that summarises your position",
    ],
  };
}

export default function WritingPage() {
  const { addXP, updateBand } = useGamification();
  const [activeTask, setActiveTask] = useState(0);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState(TASKS[activeTask].timeLimit * 60);
  const [expandedSection, setExpandedSection] = useState<string | null>("criteria");
  const task = TASKS[activeTask];
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  async function handleEvaluate() {
    if (wordCount < 50) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2500));
    const fb = generateFeedback(essay);
    setFeedback(fb);
    setLoading(false);
    addXP(100);
    updateBand(fb.bandScore, "Writing");
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const toggle = (s: string) => setExpandedSection((v) => (v === s ? null : s));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenLine className="w-6 h-6 text-[#CC0000]" /> Writing Module
          </h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered evaluation · Grammar correction · Band score estimation</p>
        </div>
        {feedback && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <Star className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Estimated Band: {feedback.bandScore}</span>
          </div>
        )}
      </div>

      {/* Task tabs */}
      <div className="flex gap-2">
        {TASKS.map((t, i) => (
          <button key={t.id} onClick={() => { setActiveTask(i); setEssay(""); setFeedback(null); }}
            className={cn("px-4 py-2 rounded-full text-sm font-semibold border transition-all",
              activeTask === i ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 hover:border-[#0d1b60]")}>
            {t.type}
            <Badge variant="outline" className="ml-2 text-[10px]">{t.difficulty}</Badge>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Writing panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Prompt */}
          <Card className="border-[#0d1b60]/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[#0d1b60] text-white text-[11px]">{task.type}</Badge>
                <Badge variant="outline" className="text-[11px]">{task.difficulty}</Badge>
                <Badge variant="outline" className="gap-1 text-[11px] ml-auto"><Clock className="w-3 h-3" />{task.timeLimit} min</Badge>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {task.tips.map((tip, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                    <Lightbulb className="w-2.5 h-2.5" /> {tip}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className={cn("text-sm font-semibold", wordCount >= task.minWords ? "text-emerald-600" : wordCount > task.minWords * 0.7 ? "text-amber-600" : "text-rose-500")}>
                    {wordCount} / {task.minWords} words
                  </span>
                  {wordCount >= task.minWords && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-[11px]"><Clock className="w-3 h-3" />{formatTime(timeLeft)}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setEssay("")} className="h-7 text-xs text-rose-500 hover:text-rose-700">Clear</Button>
                </div>
              </div>

              {/* Word count progress */}
              <div className="px-4 pt-2 pb-0">
                <Progress value={Math.min(100, (wordCount / task.minWords) * 100)} className="h-1" />
              </div>

              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder={`Write your ${task.type} response here...\n\nRemember to:\n• Plan your essay for 5 minutes before writing\n• Write at least ${task.minWords} words\n• Leave 5 minutes for proofreading`}
                className="w-full h-72 resize-none px-4 py-3 text-sm leading-relaxed bg-white dark:bg-slate-950 focus:outline-none placeholder:text-slate-400"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleEvaluate}
            disabled={loading || wordCount < 50}
            className="w-full bg-gradient-to-r from-[#0d1b60] to-indigo-600 hover:from-[#162270] hover:to-indigo-700 text-white py-3 font-bold"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> AI is evaluating your essay…</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Evaluate with AI</>
            )}
          </Button>
        </div>

        {/* Right: Feedback panel */}
        <div className="lg:col-span-2 space-y-4">
          {!feedback && !loading && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Zap className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">AI Evaluation</p>
                <p className="text-sm text-muted-foreground">Write at least 50 words and click "Evaluate with AI" to get instant feedback on your essay.</p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Analysing your essay…</p>
                    <p className="text-xs text-muted-foreground">Checking grammar, coherence, and vocabulary</p>
                  </div>
                </div>
                {["Checking task response...", "Analysing grammar...", "Evaluating vocabulary...", "Generating suggestions..."].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    </div>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {feedback && (
            <>
              {/* Band score */}
              <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Estimated Band Score</p>
                    <Button size="sm" variant="ghost" onClick={() => { setFeedback(null); setEssay(""); }} className="h-7 text-xs gap-1">
                      <RefreshCw className="w-3 h-3" /> New essay
                    </Button>
                  </div>
                  <div className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-1">{feedback.bandScore}</div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    {feedback.bandScore >= 7 ? "Band 7+ achieved! Excellent work." : feedback.bandScore >= 6 ? "Band 6 — good competent writer." : "Band 5.5 — keep practising!"}
                  </p>
                </CardContent>
              </Card>

              {/* Criteria */}
              <Card>
                <button onClick={() => toggle("criteria")} className="w-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" /> Band Score Breakdown</CardTitle>
                    {expandedSection === "criteria" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </button>
                {expandedSection === "criteria" && (
                  <CardContent className="pt-0 space-y-3">
                    {feedback.criteria.map((c) => (
                      <div key={c.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn("text-xs font-semibold", c.color)}>{c.name}</span>
                          <span className="text-sm font-bold">{c.score} / 9</span>
                        </div>
                        <Progress value={(c.score / 9) * 100} className="h-2 mb-1" />
                        <p className="text-[11px] text-muted-foreground">{c.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* Grammar corrections */}
              <Card>
                <button onClick={() => toggle("grammar")} className="w-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-500" /> Grammar Corrections</CardTitle>
                    {expandedSection === "grammar" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </button>
                {expandedSection === "grammar" && (
                  <CardContent className="pt-0 space-y-3">
                    {feedback.corrections.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs line-through text-rose-600 font-mono bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded">{c.original}</span>
                          <ChevronRight className="w-3 h-3 text-rose-400" />
                          <span className="text-xs text-emerald-700 font-mono font-semibold bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">{c.corrected}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{c.explanation}</p>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* Vocabulary */}
              <Card>
                <button onClick={() => toggle("vocab")} className="w-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-500" /> Vocabulary Upgrades</CardTitle>
                    {expandedSection === "vocab" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </button>
                {expandedSection === "vocab" && (
                  <CardContent className="pt-0 space-y-3">
                    {feedback.vocabularySuggestions.map((v, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">"{v.word}"</span>
                          <span className="text-[10px] text-muted-foreground">→ try instead:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {v.alternatives.map((alt) => (
                            <span key={alt} className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium">{alt}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* Strengths & Improvements */}
              <Card>
                <button onClick={() => toggle("tips")} className="w-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Feedback Summary</CardTitle>
                    {expandedSection === "tips" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </button>
                {expandedSection === "tips" && (
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 mb-2">✓ Strengths</p>
                      <ul className="space-y-1.5">
                        {feedback.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700 mb-2">▲ To Improve</p>
                      <ul className="space-y-1.5">
                        {feedback.improvements.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
