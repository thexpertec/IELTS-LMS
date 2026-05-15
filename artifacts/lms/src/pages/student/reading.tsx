import { useState, useRef } from "react";
import {
  BookText, Clock, ChevronRight, Highlighter, StickyNote, X,
  CheckCircle2, AlertCircle, ZoomIn, ZoomOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

const PASSAGES = [
  {
    id: 1, title: "The History of Coffee",
    subtitle: "Passage 1 · Academic Reading",
    difficulty: "Medium", wordCount: 680,
    text: `Coffee, one of the world's most popular beverages, has a history stretching back over a millennium. The earliest credible evidence of coffee-drinking or knowledge of the coffee tree appears in the middle of the fifteenth century in the accounts of Ahmed al-Ghaffar in Yemen.

The Coffea plant originated in the highlands of Ethiopia, where it still grows wild today. According to legend, a goat herder named Kaldi first discovered its stimulating properties after noticing that his goats did not sleep at night after eating berries from a certain tree. He brought the berries to a local monastery, where the abbot made a drink with the berries and discovered that it kept him alert through the long hours of evening prayer.

Coffee houses, known as qahveh khaneh, began appearing in the Near East during the fifteenth century. These establishments quickly became centres of social activity and communication in cities across the Near East, North Africa, and eventually Europe. By the seventeenth century, coffee had made its way to Europe and was gaining popularity across the continent.

In England, coffee houses played a particularly significant role in intellectual and commercial life during the seventeenth and eighteenth centuries. They were nicknamed "penny universities" because for the price of a penny – the cost of admission, which included a cup of coffee – one could sit for hours and engage in stimulating conversation. Different establishments attracted different clientele: merchants, brokers, lawyers, and artists each had their preferred haunts.

The Dutch were the first to transport and cultivate coffee commercially outside Arabia and Ethiopia. They obtained seedlings in 1616 and were able to establish a successful cultivation of coffee in India and later in Ceylon. In 1714, the Mayor of Amsterdam presented a gift of a young coffee plant to King Louis XIV of France. The King ordered it to be planted in the Royal Botanical Garden in Paris.

Today, coffee is the second most traded commodity in the world after petroleum, with an estimated 2.25 billion cups consumed every day. The global coffee industry is worth more than $100 billion and provides livelihoods for more than 25 million farming families worldwide.`,
    questions: [
      { id: 1, type: "tfng", text: "Kaldi was a shepherd who discovered coffee's properties by observing his animals.", options: ["True", "False", "Not Given"], answer: 0 },
      { id: 2, type: "tfng", text: "Coffee houses in England were exclusively for wealthy merchants.", options: ["True", "False", "Not Given"], answer: 1 },
      { id: 3, type: "mcq", text: "What was the cost of entry to English coffee houses in the 17th century?", options: ["Tuppence", "One penny", "Sixpence", "One shilling"], answer: 1 },
      { id: 4, type: "tfng", text: "The Dutch were the first Europeans to cultivate coffee commercially.", options: ["True", "False", "Not Given"], answer: 0 },
      { id: 5, type: "mcq", text: "How many cups of coffee are consumed globally each day?", options: ["1.5 billion", "2 billion", "2.25 billion", "3 billion"], answer: 2 },
      { id: 6, type: "fill", text: "Coffee houses in the Near East were known as _______.", answer: "qahveh khaneh" },
    ],
  },
];

type HighlightColor = "yellow" | "green" | "blue" | "pink";
const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-800/50",
  green: "bg-green-200 dark:bg-green-800/50",
  blue: "bg-blue-200 dark:bg-blue-800/50",
  pink: "bg-pink-200 dark:bg-pink-800/50",
};

export default function ReadingPage() {
  const { addXP } = useGamification();
  const [activePassage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60 * 20);
  const [timerActive] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [highlightColor, setHighlightColor] = useState<HighlightColor>("yellow");
  const [highlights, setHighlights] = useState<{ text: string; color: HighlightColor }[]>([]);
  const [notes, setNotes] = useState<{ text: string; note: string }[]>([]);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [activeView, setActiveView] = useState<"split" | "passage" | "questions">("split");
  const passage = PASSAGES[activePassage];

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function handleHighlight() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text) return;
    setHighlights((prev) => [...prev, { text, color: highlightColor }]);
    sel.removeAllRanges();
  }

  function renderPassage(text: string) {
    let result = text;
    highlights.forEach(({ text: ht, color }) => {
      result = result.replace(ht, `<mark class="${HIGHLIGHT_COLORS[color]} rounded px-0.5">${ht}</mark>`);
    });
    return result;
  }

  function handleSubmit() {
    let correct = 0;
    passage.questions.forEach((q) => {
      const ans = answers[q.id];
      if ((q.type === "mcq" || q.type === "tfng") && ans === q.answer) correct++;
      if (q.type === "fill" && String(ans).toLowerCase().trim() === String(q.answer).toLowerCase()) correct++;
    });
    const pct = Math.round((correct / passage.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    addXP(correct * 15);
  }

  const PassageView = (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <Highlighter className="w-4 h-4 text-slate-500" />
          {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((c) => (
            <button key={c} onClick={() => setHighlightColor(c)}
              className={cn("w-5 h-5 rounded-full border-2 transition-all",
                `bg-${c}-300`,
                highlightColor === c ? "border-slate-800 scale-110" : "border-transparent")} />
          ))}
          <Button size="sm" variant="outline" onClick={handleHighlight} className="h-7 text-xs ml-1">Highlight</Button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setFontSize((f) => Math.max(12, f - 1))} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-muted-foreground w-8 text-center">{fontSize}px</span>
          <button onClick={() => setFontSize((f) => Math.min(22, f + 1))} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
        {highlights.length > 0 && (
          <button onClick={() => setHighlights([])} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear highlights
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">{passage.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{passage.subtitle} · {passage.wordCount} words</p>
        </CardHeader>
        <CardContent className="pt-4 max-h-[60vh] overflow-y-auto">
          {passage.text.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: `${fontSize}px` }} className="mb-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderPassage(para) }} />
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const QuestionsView = (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Questions 1–{passage.questions.length}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5 max-h-[75vh] overflow-y-auto">
        {passage.questions.map((q, qi) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCorrect = submitted && ((q.type === "mcq" || q.type === "tfng") ? answers[q.id] === q.answer : String(answers[q.id]).toLowerCase().trim() === String(q.answer).toLowerCase());
          return (
            <div key={q.id} className={cn("p-4 rounded-xl border transition-colors",
              submitted ? isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-rose-50 dark:bg-rose-950/20 border-rose-200"
              : isAnswered ? "border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-700")}>
              <div className="flex items-start gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#0d1b60] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{qi + 1}</span>
                <div className="flex-1">
                  {(q.type === "tfng") && <Badge variant="outline" className="text-[10px] mb-1">True / False / Not Given</Badge>}
                  <p className="text-sm font-medium leading-relaxed">{q.text}</p>
                </div>
              </div>

              {(q.type === "mcq" || q.type === "tfng") && (
                <div className="grid grid-cols-1 gap-1.5 ml-9">
                  {q.options!.map((opt, oi) => (
                    <button key={oi} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                      className={cn("text-left text-sm px-3 py-2 rounded-lg border transition-all",
                        submitted ? oi === q.answer ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-semibold"
                          : answers[q.id] === oi ? "bg-rose-100 border-rose-400 text-rose-800"
                          : "border-slate-200 text-slate-500"
                        : answers[q.id] === oi ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "fill" && (
                <div className="ml-9">
                  <input type="text" placeholder="Write your answer..." disabled={submitted}
                    value={String(answers[q.id] ?? "")}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-900 dark:border-slate-700" />
                  {submitted && !isCorrect && <p className="text-xs text-emerald-600 mt-1 font-semibold">✓ Answer: {q.answer}</p>}
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
            <p className="text-sm font-semibold mb-2">{score! >= 80 ? "Excellent reading comprehension!" : score! >= 60 ? "Good job!" : "Keep practising!"}</p>
            <p className="text-xs text-muted-foreground mb-3">Estimated band: {score! >= 80 ? "7.0" : score! >= 65 ? "6.5" : score! >= 50 ? "6.0" : "5.5"}</p>
            <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setAnswers({}); setScore(null); }}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookText className="w-6 h-6 text-[#CC0000]" /> Reading Practice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">IELTS Academic — 3 Passages · 40 Questions · 60 Minutes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={timeLeft < 300 ? "destructive" : "outline"} className="gap-1 text-sm">
            <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
          </Badge>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {(["split", "passage", "questions"] as const).map((v) => (
              <button key={v} onClick={() => setActiveView(v)}
                className={cn("px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  activeView === v ? "bg-[#0d1b60] text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout */}
      {activeView === "split" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>{PassageView}</div>
          <div>{QuestionsView}</div>
        </div>
      )}
      {activeView === "passage" && <div>{PassageView}</div>}
      {activeView === "questions" && <div>{QuestionsView}</div>}
    </div>
  );
}
