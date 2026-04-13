import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Users, UserPlus, Moon, Sun, GraduationCap, ClipboardList, Menu, X, FileText, LogOut, Settings2, MessageSquare, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: chatConversations } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<{ unread: number }[]>;
    },
    refetchInterval: 10000,
    enabled: !!user,
  });
  const unreadMessages = chatConversations?.reduce((s, c) => s + (c.unread ?? 0), 0) ?? 0;

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Quizzes", href: "/quizzes", icon: ClipboardList },
    { name: "Assignments", href: "/assignments", icon: FileText },
    { name: "Enrollments", href: "/enrollments", icon: UserPlus },
    { name: "Students", href: "/students", icon: Users },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Lesson Types", href: "/lesson-types", icon: Settings2 },
    { name: "Organization", href: "/organization-settings", icon: Building2 },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          LMS Admin
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              data-testid={`nav-${item.name.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
              {item.name === "Messages" && unreadMessages > 0 && (
                <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-1 shrink-0">
        <Link
          href="/student"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="nav-student-portal"
        >
          <GraduationCap className="w-4 h-4" />
          Student Portal
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          data-testid="btn-toggle-theme"
        >
          {theme === "dark" ? (
            <><Sun className="w-4 h-4" />Light Mode</>
          ) : (
            <><Moon className="w-4 h-4" />Dark Mode</>
          )}
        </Button>
        {user && (
          <div className="pt-2 border-t mt-2">
            <div className="px-3 pb-1">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => { void logout(); }}
              data-testid="btn-logout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r bg-card flex-col">
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
          <div className="flex items-center gap-2 font-bold text-base tracking-tight">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            LMS Admin
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
