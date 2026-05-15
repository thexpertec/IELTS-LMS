import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  category: "streak" | "score" | "completion" | "practice" | "speed";
}

export interface GamificationState {
  xp: number;
  level: number;
  xpToNextLevel: number;
  streak: number;
  longestStreak: number;
  weeklyXP: number[];
  targetBand: number;
  currentBand: number;
  bandHistory: { date: string; band: number; module: string }[];
  badges: Badge[];
  leaderboard: { rank: number; name: string; xp: number; avatar: string; isMe?: boolean }[];
  dailyGoalMinutes: number;
  todayMinutes: number;
  totalStudyHours: number;
  addXP: (amount: number) => void;
  updateBand: (band: number, module: string) => void;
  extendStreak: () => void;
}

const GamificationContext = createContext<GamificationState | null>(null);

const INITIAL_BADGES: Badge[] = [
  { id: "first-login", name: "First Step", description: "Logged in for the first time", icon: "🎯", earned: true, earnedAt: "2026-05-01", category: "completion" },
  { id: "streak-3", name: "3-Day Streak", description: "Studied 3 days in a row", icon: "🔥", earned: true, earnedAt: "2026-05-03", category: "streak" },
  { id: "streak-7", name: "Week Warrior", description: "Studied 7 days in a row", icon: "⚡", earned: true, earnedAt: "2026-05-07", category: "streak" },
  { id: "streak-30", name: "Iron Discipline", description: "Studied 30 days in a row", icon: "💎", earned: false, category: "streak" },
  { id: "band-6", name: "Band 6 Achieved", description: "Scored Band 6 in any module", icon: "🥉", earned: true, earnedAt: "2026-05-08", category: "score" },
  { id: "band-7", name: "Band 7 Achieved", description: "Scored Band 7 in any module", icon: "🥇", earned: false, category: "score" },
  { id: "perfect-quiz", name: "Perfect Score", description: "100% in a quiz", icon: "✨", earned: true, earnedAt: "2026-05-10", category: "score" },
  { id: "speed-reader", name: "Speed Reader", description: "Completed reading in under 55 min", icon: "📚", earned: false, category: "speed" },
  { id: "writer", name: "Wordsmith", description: "Submitted 5 writing tasks", icon: "✍️", earned: true, earnedAt: "2026-05-12", category: "practice" },
  { id: "speaker", name: "Confident Speaker", description: "Completed 10 speaking sessions", icon: "🎙️", earned: false, category: "practice" },
  { id: "vocab-100", name: "Vocabulary Ace", description: "Learned 100 words", icon: "📖", earned: false, category: "practice" },
  { id: "mock-test-1", name: "First Mock Test", description: "Completed your first full mock test", icon: "📝", earned: true, earnedAt: "2026-05-09", category: "completion" },
];

const INITIAL_LEADERBOARD = [
  { rank: 1, name: "Priya Sharma", xp: 4820, avatar: "PS" },
  { rank: 2, name: "Ahmed Al-Farsi", xp: 4210, avatar: "AA" },
  { rank: 3, name: "Li Wei", xp: 3980, avatar: "LW" },
  { rank: 4, name: "You", xp: 3640, avatar: "ME", isMe: true },
  { rank: 5, name: "Sara Malik", xp: 3520, avatar: "SM" },
  { rank: 6, name: "James Okafor", xp: 3105, avatar: "JO" },
  { rank: 7, name: "Maria García", xp: 2890, avatar: "MG" },
  { rank: 8, name: "Yuki Tanaka", xp: 2641, avatar: "YT" },
];

const INITIAL_BAND_HISTORY = [
  { date: "2026-04-01", band: 5.5, module: "Overall" },
  { date: "2026-04-08", band: 5.5, module: "Listening" },
  { date: "2026-04-15", band: 6.0, module: "Reading" },
  { date: "2026-04-22", band: 5.5, module: "Writing" },
  { date: "2026-04-29", band: 6.0, module: "Speaking" },
  { date: "2026-05-06", band: 6.0, module: "Overall" },
  { date: "2026-05-10", band: 6.5, module: "Listening" },
  { date: "2026-05-14", band: 6.0, module: "Reading" },
];

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(3640);
  const [level, setLevel] = useState(8);
  const [streak, setStreak] = useState(12);
  const [currentBand, setCurrentBand] = useState(6.0);
  const [bandHistory, setBandHistory] = useState(INITIAL_BAND_HISTORY);
  const [todayMinutes, setTodayMinutes] = useState(47);

  const xpToNextLevel = 500 - (xp % 500);

  const addXP = useCallback((amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      const newLevel = Math.floor(newXp / 500) + 1;
      setLevel(newLevel);
      return newXp;
    });
    setTodayMinutes((prev) => prev + Math.ceil(amount / 5));
  }, []);

  const updateBand = useCallback((band: number, module: string) => {
    setCurrentBand(band);
    setBandHistory((prev) => [
      ...prev,
      { date: new Date().toISOString().slice(0, 10), band, module },
    ]);
  }, []);

  const extendStreak = useCallback(() => {
    setStreak((prev) => prev + 1);
  }, []);

  const value: GamificationState = {
    xp,
    level,
    xpToNextLevel,
    streak,
    longestStreak: 18,
    weeklyXP: [120, 200, 85, 310, 175, 240, 180],
    targetBand: 7.0,
    currentBand,
    bandHistory,
    badges: INITIAL_BADGES,
    leaderboard: INITIAL_LEADERBOARD,
    dailyGoalMinutes: 60,
    todayMinutes,
    totalStudyHours: 84,
    addXP,
    updateBand,
    extendStreak,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}
