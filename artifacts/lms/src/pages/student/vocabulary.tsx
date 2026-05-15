import { useState } from "react";
import {
  Layers, ChevronRight, ChevronLeft, RotateCcw, Check, X,
  Star, BookOpen, Filter, Search, Volume2, Bookmark, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useGamification } from "@/context/gamification-context";

interface Word {
  id: number; word: string; phonetic: string; type: string;
  definition: string; example: string; synonyms: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  topic: string; learned: boolean; starred: boolean;
}

const WORDS: Word[] = [
  { id: 1, word: "Substantiate", phonetic: "/səbˈstænʃɪeɪt/", type: "verb", definition: "To provide evidence to support or prove the truth of something.", example: "The scientist was unable to substantiate her claims without further data.", synonyms: ["verify", "confirm", "validate", "corroborate"], difficulty: "advanced", topic: "Academic", learned: true, starred: true },
  { id: 2, word: "Mitigate", phonetic: "/ˈmɪtɪɡeɪt/", type: "verb", definition: "To make less severe, serious, or painful.", example: "Wearing sunscreen can help mitigate the risk of skin cancer.", synonyms: ["reduce", "alleviate", "diminish", "lessen"], difficulty: "intermediate", topic: "IELTS Writing", learned: true, starred: false },
  { id: 3, word: "Proliferate", phonetic: "/prəˈlɪfəreɪt/", type: "verb", definition: "To increase rapidly in number; to multiply.", example: "Social media platforms have proliferated in recent years.", synonyms: ["multiply", "expand", "spread", "grow"], difficulty: "advanced", topic: "IELTS Writing", learned: false, starred: false },
  { id: 4, word: "Pragmatic", phonetic: "/præɡˈmætɪk/", type: "adjective", definition: "Dealing with things sensibly and realistically rather than theoretically.", example: "A pragmatic approach to education focuses on practical skills.", synonyms: ["practical", "realistic", "sensible", "rational"], difficulty: "intermediate", topic: "Academic", learned: false, starred: true },
  { id: 5, word: "Advocate", phonetic: "/ˈædvəkət/", type: "verb/noun", definition: "To publicly recommend or support; a person who supports a cause.", example: "She is a strong advocate for environmental protection.", synonyms: ["champion", "support", "promote", "defend"], difficulty: "intermediate", topic: "IELTS Speaking", learned: true, starred: false },
  { id: 6, word: "Paradigm", phonetic: "/ˈpærədaɪm/", type: "noun", definition: "A typical example or pattern of something; a model.", example: "The internet has created a new paradigm for communication.", synonyms: ["model", "framework", "pattern", "standard"], difficulty: "advanced", topic: "Academic", learned: false, starred: false },
  { id: 7, word: "Exacerbate", phonetic: "/ɪɡˈzæsəbeɪt/", type: "verb", definition: "To make a problem, bad situation, or negative feeling worse.", example: "Cutting public spending only exacerbates inequality.", synonyms: ["worsen", "aggravate", "intensify", "compound"], difficulty: "advanced", topic: "IELTS Writing", learned: false, starred: true },
  { id: 8, word: "Inevitable", phonetic: "/ɪnˈevɪtəbl/", type: "adjective", definition: "Certain to happen; unable to be avoided or prevented.", example: "With modern technology, change seems inevitable.", synonyms: ["unavoidable", "certain", "inescapable", "destined"], difficulty: "beginner", topic: "IELTS Speaking", learned: true, starred: false },
];

type Mode = "browse" | "flashcard" | "quiz";

export default function VocabularyPage() {
  const { addXP } = useGamification();
  const [mode, setMode] = useState<Mode>("browse");
  const [filter, setFilter] = useState<"all" | "learned" | "starred" | "unlearned">("all");
  const [topicFilter, setTopicFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean>>({});
  const [words, setWords] = useState(WORDS);

  const topics = ["All", ...Array.from(new Set(WORDS.map((w) => w.topic)))];
  const filtered = words.filter((w) => {
    if (filter === "learned" && !w.learned) return false;
    if (filter === "starred" && !w.starred) return false;
    if (filter === "unlearned" && w.learned) return false;
    if (topicFilter !== "All" && w.topic !== topicFilter) return false;
    if (search && !w.word.toLowerCase().includes(search.toLowerCase()) && !w.definition.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const flashcardWords = filtered.length > 0 ? filtered : words;
  const currentCard = flashcardWords[cardIdx % flashcardWords.length];

  function toggleLearned(id: number) {
    setWords((prev) => prev.map((w) => w.id === id ? { ...w, learned: !w.learned } : w));
    addXP(10);
  }
  function toggleStarred(id: number) {
    setWords((prev) => prev.map((w) => w.id === id ? { ...w, starred: !w.starred } : w));
  }

  const learnedCount = words.filter((w) => w.learned).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#CC0000]" /> Vocabulary Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Master IELTS academic vocabulary with AI-powered flashcards</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{learnedCount}/{words.length} learned</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Words", value: words.length, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-50 dark:bg-slate-900" },
          { label: "Learned", value: learnedCount, color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Starred", value: words.filter((w) => w.starred).length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Progress", value: `${Math.round((learnedCount / words.length) * 100)}%`, color: "text-indigo-700", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
        ].map((s) => (
          <div key={s.label} className={cn("p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center", s.bg)}>
            <div className={cn("text-2xl font-extrabold", s.color)}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <Progress value={(learnedCount / words.length) * 100} className="h-2" />

      {/* Mode tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["browse", "flashcard", "quiz"] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setCardIdx(0); setFlipped(false); setQuizIdx(0); setQuizAnswers({}); }}
            className={cn("px-5 py-2 rounded-full text-sm font-semibold capitalize border transition-all",
              mode === m ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 hover:border-[#0d1b60]")}>
            {m === "browse" ? "📖 Browse" : m === "flashcard" ? "🃏 Flashcards" : "❓ Quiz Mode"}
          </button>
        ))}
      </div>

      {/* Browse mode */}
      {mode === "browse" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search words…"
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-44" />
            </div>
            {(["all", "learned", "unlearned", "starred"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all",
                  filter === f ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "border-slate-200 dark:border-slate-700 hover:border-slate-300")}>
                {f === "all" ? "All" : f === "learned" ? "✓ Learned" : f === "unlearned" ? "◯ To Learn" : "★ Starred"}
              </button>
            ))}
            <div className="flex gap-1 ml-auto">
              {topics.map((t) => (
                <button key={t} onClick={() => setTopicFilter(t)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    topicFilter === t ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((w) => (
              <Card key={w.id} className={cn("transition-all hover:shadow-md", w.learned && "border-emerald-200 dark:border-emerald-800")}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xl font-bold">{w.word}</span>
                        <button className="text-slate-300 hover:text-indigo-500 transition-colors"><Volume2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{w.phonetic}</span>
                        <Badge variant="outline" className="text-[10px] h-4">{w.type}</Badge>
                        <Badge variant="outline" className={cn("text-[10px] h-4",
                          w.difficulty === "advanced" ? "border-rose-300 text-rose-600" : w.difficulty === "intermediate" ? "border-amber-300 text-amber-600" : "border-green-300 text-green-600")}>
                          {w.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleStarred(w.id)} className={cn("p-1.5 rounded-lg transition-colors", w.starred ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30" : "text-slate-300 hover:text-amber-400")}>
                        <Star className={cn("w-4 h-4", w.starred && "fill-amber-400")} />
                      </button>
                      <button onClick={() => toggleLearned(w.id)}
                        className={cn("p-1.5 rounded-lg transition-colors", w.learned ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : "text-slate-300 hover:text-emerald-500")}>
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{w.definition}</p>
                  <p className="text-xs text-muted-foreground italic mb-2">"{w.example}"</p>
                  <div className="flex flex-wrap gap-1">
                    {w.synonyms.map((s) => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{s}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Layers className="w-10 h-10 opacity-30 mx-auto mb-2" />
                <p>No words match your filter</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Flashcard mode */}
      {mode === "flashcard" && currentCard && (
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-4 text-sm text-muted-foreground">
            {(cardIdx % flashcardWords.length) + 1} / {flashcardWords.length}
          </div>

          {/* Card */}
          <div onClick={() => setFlipped((f) => !f)}
            className={cn("relative h-64 rounded-2xl border-2 cursor-pointer transition-all shadow-lg hover:shadow-xl",
              flipped ? "bg-[#0d1b60] border-[#0d1b60] text-white" : "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800")}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {!flipped ? (
                <>
                  <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-600">{currentCard.topic}</Badge>
                  <p className="text-4xl font-extrabold mb-2">{currentCard.word}</p>
                  <p className="text-muted-foreground text-sm">{currentCard.phonetic} · {currentCard.type}</p>
                  <p className="text-xs text-muted-foreground mt-4">Tap to reveal definition</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold mb-3 text-white/90">{currentCard.definition}</p>
                  <p className="text-sm italic text-white/70 mb-3">"{currentCard.example}"</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {currentCard.synonyms.slice(0, 3).map((s) => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-white/80">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            <button onClick={() => { setFlipped(false); setCardIdx((i) => (i - 1 + flashcardWords.length) % flashcardWords.length); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-2">
              <button onClick={() => { toggleLearned(currentCard.id); setFlipped(false); setCardIdx((i) => (i + 1) % flashcardWords.length); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-100 transition-colors">
                <X className="w-4 h-4" /> Still learning
              </button>
              <button onClick={() => { toggleLearned(currentCard.id); setFlipped(false); setCardIdx((i) => (i + 1) % flashcardWords.length); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors">
                <Check className="w-4 h-4" /> Got it!
              </button>
            </div>
            <button onClick={() => { setFlipped(false); setCardIdx((i) => (i + 1) % flashcardWords.length); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quiz mode */}
      {mode === "quiz" && (
        <div className="max-w-xl mx-auto space-y-5">
          {quizIdx < flashcardWords.length ? (
            (() => {
              const w = flashcardWords[quizIdx];
              const distractors = words.filter((x) => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3);
              const options = [...distractors, w].sort(() => Math.random() - 0.5);
              return (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <Badge variant="outline" className="mb-3">{quizIdx + 1} / {flashcardWords.length}</Badge>
                      <p className="text-xs text-muted-foreground mb-2">Which definition matches:</p>
                      <p className="text-3xl font-extrabold">{w.word}</p>
                      <p className="text-sm text-muted-foreground">{w.phonetic}</p>
                    </div>
                    <div className="space-y-2">
                      {options.map((opt, i) => {
                        const answered = quizAnswers[quizIdx] !== undefined;
                        const isCorrect = opt.id === w.id;
                        const isSelected = quizAnswers[quizIdx] === i;
                        return (
                          <button key={opt.id} disabled={answered} onClick={() => {
                            setQuizAnswers({ ...quizAnswers, [quizIdx]: i });
                            if (isCorrect) addXP(25);
                            setTimeout(() => setQuizIdx((q) => q + 1), 1200);
                          }}
                            className={cn("w-full text-left text-sm px-4 py-3 rounded-xl border transition-all",
                              !answered ? "border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900"
                                : isCorrect ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold dark:bg-emerald-950/30"
                                : isSelected ? "bg-rose-50 border-rose-400 text-rose-800 dark:bg-rose-950/30"
                                : "border-slate-200 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-900")}>
                            {opt.definition}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-extrabold mb-2">Quiz Complete!</h3>
                <p className="text-muted-foreground mb-4">You answered {flashcardWords.length} questions</p>
                <div className="text-3xl font-bold text-indigo-600 mb-4">+{flashcardWords.length * 25} XP</div>
                <Button onClick={() => { setQuizIdx(0); setQuizAnswers({}); }} className="bg-[#0d1b60]">
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
