import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Home, FileText, Bell, User, LogOut, GraduationCap, Sun, Moon, ClipboardList, Menu, MessageSquare } from "lucide-react";
import { useStudent } from "@/context/student-context";
import { useQuery } from "@tanstack/react-query";
import { useGetStudentNotifications } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: Home },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/student/assignments", label: "Assignments", icon: FileText },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
  { href: "/student/messages", label: "Messages", icon: MessageSquare },
  { href: "/student/profile", label: "Profile", icon: User },
];

export function StudentLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { student, logout } = useStudent();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications } = useGetStudentNotifications(
    { email: student?.email ?? "" },
    { query: { enabled: !!student?.email } }
  );

  const { data: chatConversations } = useQuery({
    queryKey: ["student-chat-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<{ unread: number }[]>;
    },
    enabled: !!student?.email,
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

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Student Portal</p>
            <p className="font-bold text-sm leading-tight">LMS Learning</p>
          </div>
        </div>
      </div>

      {student && (
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{student.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location === href || location.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {label === "Notifications" && unreadCount > 0 && (
                <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              {label === "Messages" && unreadMessages > 0 && (
                <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Exit Portal
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <aside className="hidden lg:flex w-64 border-r bg-card flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r flex flex-col transition-transform duration-200 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 border-b bg-card shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Student Portal</span>
          </div>
          {unreadCount > 0 && (
            <Badge className="ml-auto h-5 px-1.5 text-xs bg-destructive">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
