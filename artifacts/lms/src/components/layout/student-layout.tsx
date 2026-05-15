import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen, Home, FileText, Bell, User, LogOut, GraduationCap,
  ClipboardList, Menu, MessageSquare, Eye, ArrowLeft, X,
  Headphones, BookText, PenLine, Mic, Layers, BarChart2,
  Award, StickyNote, Settings, Timer, Flame, Zap, ChevronDown,
} from "lucide-react";
import { useStudent } from "@/context/student-context";
import { useGamification } from "@/context/gamification-context";
import { useGetStudentNotifications } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/student/dashboard", label: "Dashboard", icon: Home },
      { href: "/student/courses", label: "My Courses", icon: BookOpen },
      { href: "/student/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "IELTS Modules",
    items: [
      { href: "/student/listening", label: "Listening", icon: Headphones },
      { href: "/student/reading", label: "Reading", icon: BookText },
      { href: "/student/writing", label: "Writing", icon: PenLine },
      { href: "/student/speaking", label: "Speaking", icon: Mic },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/student/mock-tests", label: "Mock Tests", icon: Timer },
      { href: "/student/vocabulary", label: "Vocabulary", icon: Layers },
      { href: "/student/quizzes", label: "Quizzes", icon: ClipboardList },
      { href: "/student/assignments", label: "Assignments", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/student/certificates", label: "Certificates", icon: Award },
      { href: "/student/notes", label: "Notes", icon: StickyNote },
      { href: "/student/notifications", label: "Notifications", icon: Bell },
      { href: "/student/messages", label: "Messages", icon: MessageSquare },
      { href: "/student/profile", label: "Profile", icon: User },
      { href: "/student/settings", label: "Settings", icon: Settings },
    ],
  },
];

const TOP_NAV_ITEMS = [
  { href: "/student/dashboard", label: "Dashboard", icon: Home },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/listening", label: "Listening", icon: Headphones },
  { href: "/student/reading", label: "Reading", icon: BookText },
  { href: "/student/writing", label: "Writing", icon: PenLine },
  { href: "/student/speaking", label: "Speaking", icon: Mic },
  { href: "/student/mock-tests", label: "Mock Tests", icon: Timer },
  { href: "/student/analytics", label: "Analytics", icon: BarChart2 },
];

export function StudentLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { student, isAdminPreview, logout, exitAdminPreview } = useStudent();
  const { streak, xp, level } = useGamification();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroupOpen, setMobileGroupOpen] = useState<string | null>("IELTS Modules");

  const { data: notifications } = useGetStudentNotifications(
    { email: student?.email ?? "" },
    { query: { enabled: !!student?.email && !isAdminPreview } }
  );

  const { data: chatConversations } = useQuery({
    queryKey: ["student-chat-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<{ unread: number }[]>;
    },
    enabled: !!student?.email && !isAdminPreview,
    refetchInterval: 10000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const unreadMessages = chatConversations?.reduce((s, c) => s + (c.unread ?? 0), 0) ?? 0;

  const initials = student?.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  function handleExitPreview() {
    exitAdminPreview();
    setLocation("/");
  }

  function badgeFor(href: string) {
    if (href === "/student/notifications") return unreadCount;
    if (href === "/student/messages") return unreadMessages;
    return 0;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Admin preview banner ── */}
      {isAdminPreview && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-400 text-amber-950 text-sm font-medium shrink-0 z-50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>Admin Preview — viewing student portal.</span>
          </div>
          <button
            onClick={handleExitPreview}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950/15 hover:bg-amber-950/25 transition-colors text-xs font-semibold whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
          </button>
        </div>
      )}

      {/* ── Top utility bar ── */}
      <div className="bg-[#CC0000] shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
          <span className="text-white/70 text-xs hidden sm:block">IELTS Academy LMS — Student Portal</span>
          <div className="flex items-center gap-3 ml-auto">
            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1 text-white/80 text-xs">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span className="font-bold text-orange-200">{streak}</span>
              <span>day streak</span>
            </div>
            {/* XP */}
            <div className="hidden sm:flex items-center gap-1 text-white/80 text-xs">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="font-bold text-yellow-200">{xp.toLocaleString()} XP</span>
              <span className="text-white/50">· Lv {level}</span>
            </div>
            {student && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[9px] font-bold bg-white/25 text-white">
                    {isAdminPreview ? <Eye className="w-3 h-3" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block">{isAdminPreview ? "Admin Preview" : student.displayName}</span>
              </div>
            )}
            {isAdminPreview ? (
              <button onClick={handleExitPreview} className="px-3 h-8 flex items-center gap-1.5 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
              </button>
            ) : (
              <button onClick={logout} className="px-3 h-8 flex items-center gap-1.5 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Navy branding bar ── */}
      <div className="bg-[#0d1b60] shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#0d1b60]" />
            </div>
            <div className="leading-tight">
              <span className="text-white font-bold text-base tracking-tight">IELTS</span>
              <span className="text-white/55 font-normal text-base"> Academy LMS</span>
            </div>
          </Link>
          <button
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Desktop nav tab bar ── */}
      <div className="bg-[#162270] border-b border-white/10 shrink-0 hidden lg:block">
        <div className="max-w-screen-2xl mx-auto px-4">
          <nav className="flex items-end gap-0 h-11 overflow-x-auto scrollbar-none">
            {TOP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = location === href || location.startsWith(href + "/");
              const badge = badgeFor(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 h-11 text-sm font-medium border-b-2 transition-colors relative whitespace-nowrap shrink-0",
                    isActive
                      ? "border-[#CC0000] text-white bg-white/8"
                      : "border-transparent text-white/65 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#CC0000] text-white text-[10px] font-bold">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* More dropdown for remaining items */}
            <div className="relative group flex items-center">
              <button className="flex items-center gap-2 px-4 h-11 text-sm font-medium border-b-2 border-transparent text-white/65 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
                More <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block z-50 bg-[#0d1b60] border border-white/10 rounded-b-xl shadow-2xl min-w-[180px] py-1">
                {[
                  { href: "/student/vocabulary", label: "Vocabulary", icon: Layers },
                  { href: "/student/quizzes", label: "Quizzes", icon: ClipboardList },
                  { href: "/student/assignments", label: "Assignments", icon: FileText },
                  { href: "/student/certificates", label: "Certificates", icon: Award },
                  { href: "/student/notes", label: "Notes", icon: StickyNote },
                  { href: "/student/notifications", label: "Notifications", icon: Bell },
                  { href: "/student/messages", label: "Messages", icon: MessageSquare },
                  { href: "/student/profile", label: "Profile", icon: User },
                  { href: "/student/settings", label: "Settings", icon: Settings },
                ].map(({ href, label, icon: Icon }) => {
                  const isActive = location === href;
                  const badge = badgeFor(href);
                  return (
                    <Link key={href} href={href}
                      className={cn("flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                        isActive ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/8")}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                      {badge > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#CC0000] text-white text-[10px] font-bold">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile drawer ── */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-[#0d1b60] transition-transform duration-200 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#0d1b60]" />
            </div>
            <span className="text-white font-bold">IELTS LMS</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {student && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs font-bold bg-white/20 text-white">
                {isAdminPreview ? <Eye className="w-4 h-4" /> : initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{isAdminPreview ? "Admin Preview" : student.displayName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-orange-300 text-xs flex items-center gap-1"><Flame className="w-3 h-3" />{streak}</span>
                <span className="text-yellow-300 text-xs flex items-center gap-1"><Zap className="w-3 h-3" />{xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => setMobileGroupOpen((v) => v === group.label ? null : group.label)}
                className="w-full flex items-center justify-between px-4 py-2 text-white/40 text-[11px] font-bold uppercase tracking-wider hover:text-white/60 transition-colors"
              >
                {group.label}
                <ChevronDown className={cn("w-3 h-3 transition-transform", mobileGroupOpen === group.label && "rotate-180")} />
              </button>
              {(mobileGroupOpen === group.label || mobileGroupOpen === null) && (
                <div>
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const isActive = location === href || location.startsWith(href + "/");
                    const badge = badgeFor(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                          isActive ? "bg-[#CC0000] text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                        {badge > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#CC0000] text-white text-[10px] font-bold">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {isAdminPreview ? (
            <button onClick={handleExitPreview} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-amber-300 hover:bg-white/8 rounded transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </button>
          ) : (
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 rounded transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
