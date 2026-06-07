import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StudentLayout } from "@/components/layout/student-layout";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/context/student-context";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronRight, BookOpen, Award, ArrowRight, RotateCcw, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const api = (path: string) => `${BASE}${path}`;

interface PlacementQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

const QUESTIONS: PlacementQuestion[] = [
  { id: 1, text: "She _____ to London last week.", options: ["has gone", "went", "goes", "had gone"], correctIndex: 1 },
  { id: 2, text: "The evidence _____ that regular exercise improves mental health.", options: ["suggest", "suggests", "is suggesting", "suggested"], correctIndex: 1 },
  { id: 3, text: "If I had more time, I _____ learn another language.", options: ["would", "will", "can", "must"], correctIndex: 0 },
  { id: 4, text: "The report _____ by the committee yesterday.", options: ["was reviewed", "reviewed", "has reviewed", "is reviewing"], correctIndex: 0 },
  { id: 5, text: "She is the scientist _____ research changed our understanding of the universe.", options: ["who", "whom", "whose", "which"], correctIndex: 2 },
  { id: 6, text: "Despite _____ hard, he failed the exam.", options: ["studying", "to study", "studied", "study"], correctIndex: 0 },
  { id: 7, text: "The professor asked the students _____ their assignments by Friday.", options: ["submit", "to submit", "submitting", "submitted"], correctIndex: 1 },
  { id: 8, text: "This phenomenon is increasingly _____.", options: ["prevalent", "prevailing", "prevented", "prevailed"], correctIndex: 0 },
  { id: 9, text: "You _____ bring an umbrella — it's definitely going to rain.", options: ["should", "must", "might", "could"], correctIndex: 0 },
  { id: 10, text: "By the time she graduated, she _____ three research papers.", options: ["published", "has published", "had published", "was publishing"], correctIndex: 2 },
  { id: 11, text: "The issue was too complex _____ in one meeting.", options: ["resolve", "resolving", "to resolve", "resolved"], correctIndex: 2 },
  { id: 12, text: "The term 'paradigm shift' was _____ by Thomas Kuhn.", options: ["coined", "coining", "coin", "coins"], correctIndex: 0 },
  { id: 13, text: "Neither the teachers nor the principal _____ aware of the problem.", options: ["was", "were", "are", "is been"], correctIndex: 0 },
  { id: 14, text: "The discovery had profound _____.", options: ["implications", "implication", "implicated", "implicating"], correctIndex: 0 },
  { id: 15, text: "Hardly _____ the lecture begun when she left the room.", options: ["did", "had", "was", "has"], correctIndex: 1 },
  { id: 16, text: "The findings _____ that further research is necessary.", options: ["infer", "imply", "indicate", "instruct"], correctIndex: 2 },
  { id: 17, text: "The committee reached _____ unanimous decision.", options: ["the", "a", "an", "some"], correctIndex: 1 },
  { id: 18, text: "Not only did they win the competition, _____ they broke the world record.", options: ["also", "but also", "and", "but"], correctIndex: 1 },
  { id: 19, text: "The hypothesis _____ that cognitive development is influenced by social interaction.", options: ["postulates", "postulate", "postulating", "postulated"], correctIndex: 0 },
  { id: 20, text: "The data _____ collected over a period of five years before any conclusions were drawn.", options: ["is", "was", "were", "has"], correctIndex: 2 },
];

const LEVEL_STYLES: Record<string, { color: string; bg: string; border: string; description: string }> = {
  A2: { color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", description: "Elementary — Building your foundation in English." },
  B1: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", description: "Pre-Intermediate — Developing core English skills." },
  B2: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", description: "Intermediate — Ready for mainstream IELTS preparation." },
  C1: { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", description: "Upper-Intermediate — Targeting Band 7–8 in IELTS." },
  C2: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", description: "Advanced/Proficiency — Targeting Band 8.5–9 in IELTS." },
};

type Screen = "intro" | "test" | "result";

export default function PlacementTest() {
  const { student } = useStudent();
  const [, setLocation] = useLocation();
  const [screen, setScreen] = useState<Screen>("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; level: string; recommendedCourseId: number | null; recommendedCourseTitle: string | null } | null>(null);

  const { data: existing } = useQuery({
    queryKey: ["placement-my-result", student?.email],
    queryFn: async () => {
      if (!student?.email) return null;
      const r = await fetch(api(`/api/placement/my-result?email=${encodeURIComponent(student.email)}`), { credentials: "include" });
      return r.json();
    },
    enabled: !!student?.email,
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { email: string; score: number }) => {
      const r = await fetch(api("/api/placement/attempt"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, source: "online" }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ score: number; level: string; recommendedCourseId: number | null }>;
    },
    onSuccess: async (data) => {
      // Fetch recommended course title if available
      let recommendedCourseTitle: string | null = null;
      if (data.recommendedCourseId) {
        try {
          const r = await fetch(api(`/api/placement/my-result?email=${encodeURIComponent(student?.email ?? "")}`), { credentials: "include" });
          const full = await r.json();
          recommendedCourseTitle = full?.recommendedCourseTitle ?? null;
        } catch { /* ignore */ }
      }
      setResult({ ...data, recommendedCourseTitle });
      setScreen("result");
    },
  });

  const handleAnswer = useCallback((questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const handleSubmit = () => {
    const correct = QUESTIONS.filter((q) => answers[q.id] === q.correctIndex).length;
    const score = correct * 5;
    submitMutation.mutate({ email: student?.email ?? "", score });
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  // Show existing result screen
  if (existing && screen === "intro") {
    const lvlStyle = LEVEL_STYLES[existing.level] ?? LEVEL_STYLES["B2"];
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className={`rounded-2xl border ${lvlStyle.border} ${lvlStyle.bg} p-8 text-center`}>
            <Award className={`w-12 h-12 mx-auto mb-4 ${lvlStyle.color}`} />
            <h1 className="text-2xl font-bold text-slate-900">Your Course Allocation Result</h1>
            <p className="text-slate-500 text-sm mt-1 mb-6">You've already completed the assessment.</p>
            <div className={`inline-block rounded-xl border ${lvlStyle.border} px-6 py-3 mb-4`}>
              <div className="text-4xl font-black text-slate-900">{existing.score}<span className="text-xl font-normal text-slate-400">/100</span></div>
              <div className={`text-xl font-bold mt-1 ${lvlStyle.color}`}>{existing.level}</div>
              <div className="text-sm text-slate-500 mt-0.5">{lvlStyle.description}</div>
            </div>
            {existing.assignedCourseTitle ? (
              <div className="mt-4 bg-white rounded-lg border border-emerald-200 p-4">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1"><CheckCircle2 className="w-4 h-4" />Course Assigned</div>
                <div className="font-semibold text-slate-900">{existing.assignedCourseTitle}</div>
                <Button className="mt-3 w-full" onClick={() => setLocation("/student/courses")}>
                  Go to My Courses <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            ) : existing.recommendedCourseTitle ? (
              <div className="mt-4 bg-white rounded-lg border border-blue-200 p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Recommended Course</div>
                <div className="font-semibold text-slate-900">{existing.recommendedCourseTitle}</div>
                <p className="text-xs text-slate-400 mt-1">Your teacher will assign your course shortly. Check My Courses soon.</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm mt-4">Your teacher will assign your course shortly.</p>
            )}
            <Button variant="outline" className="mt-4" onClick={() => setScreen("intro") || setResult(null)}>
              <RotateCcw className="w-4 h-4 mr-1.5" />Retake Test
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (screen === "result" && result) {
    const lvlStyle = LEVEL_STYLES[result.level] ?? LEVEL_STYLES["B2"];
    const correctCount = QUESTIONS.filter((q) => answers[q.id] === q.correctIndex).length;
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className={`rounded-2xl border ${lvlStyle.border} ${lvlStyle.bg} p-8 text-center`}>
            <Award className={`w-14 h-14 mx-auto mb-4 ${lvlStyle.color}`} />
            <h1 className="text-2xl font-bold text-slate-900">Test Complete!</h1>
            <p className="text-slate-500 text-sm mt-1 mb-6">Here are your assessment results</p>
            <div className={`inline-block rounded-xl border ${lvlStyle.border} bg-white px-8 py-4 mb-6`}>
              <div className="text-5xl font-black text-slate-900">{result.score}<span className="text-2xl font-normal text-slate-400">/100</span></div>
              <div className="text-sm text-slate-400 mt-1">{correctCount} correct out of {QUESTIONS.length} questions</div>
              <div className={`text-2xl font-bold mt-3 ${lvlStyle.color}`}>{result.level}</div>
              <div className="text-sm text-slate-500 mt-0.5">{lvlStyle.description}</div>
            </div>
            {result.recommendedCourseTitle ? (
              <div className="bg-white rounded-xl border border-blue-200 p-4 text-left mb-4">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Recommended for you</div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{result.recommendedCourseTitle}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Your teacher will review and assign your course. You'll see it in My Courses.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-4 text-left mb-4">
                <p className="text-sm text-slate-500">Your teacher will review your result and assign the most suitable course. You'll be notified soon.</p>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setAnswers({}); setScreen("test"); }}>
                <RotateCcw className="w-4 h-4 mr-1.5" />Retake
              </Button>
              <Button onClick={() => setLocation("/student/dashboard")}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (screen === "intro") {
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">IELTS Course Allocation Assessment</h1>
            <p className="text-slate-600 mt-2 mb-6">
              This short assessment helps us place you in the right course for your English level.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: "📋", label: "20 questions", sub: "Grammar & Vocabulary" },
                { icon: "⏱", label: "~15–20 min", sub: "Take your time" },
                { icon: "🎯", label: "Instant result", sub: "Level & recommendation" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-blue-100 p-3">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-4 text-left text-sm text-slate-600 mb-6">
              <strong className="text-slate-900 block mb-1">Instructions</strong>
              <ul className="space-y-1">
                <li>• Choose the best answer for each question.</li>
                <li>• There is only one correct answer per question.</li>
                <li>• You can change your answers before submitting.</li>
                <li>• There is no time limit — go at your own pace.</li>
              </ul>
            </div>
            <Button size="lg" className="w-full" onClick={() => setScreen("test")}>
              Start Test <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Test screen
  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-slate-900">IELTS Course Allocation Assessment</h2>
            <span className="text-sm text-slate-500">{answeredCount}/{QUESTIONS.length} answered</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {QUESTIONS.map((q, qi) => (
            <div key={q.id} className={`rounded-xl border p-4 transition-colors ${answers[q.id] !== undefined ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-white"}`}>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-semibold">{qi + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 mb-3">{q.text}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(q.id, oi)}
                        className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-all border ${answers[q.id] === oi
                          ? "border-blue-500 bg-blue-600 text-white font-medium"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-6 flex items-center justify-between bg-white rounded-xl border p-4 sticky bottom-4 shadow-sm">
          <div className="text-sm text-slate-500">
            {allAnswered ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />All questions answered!</span>
            ) : (
              <span>{QUESTIONS.length - answeredCount} question{QUESTIONS.length - answeredCount !== 1 ? "s" : ""} remaining</span>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={!allAnswered || submitMutation.isPending} className="min-w-[140px]">
            {submitMutation.isPending ? "Submitting..." : <>Submit Test <ChevronRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </div>
        {submitMutation.isError && (
          <p className="text-red-500 text-sm text-center mt-2">Failed to submit. Please try again.</p>
        )}
      </div>
    </StudentLayout>
  );
}

// Reuse icon from elsewhere
function ClipboardList({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}
