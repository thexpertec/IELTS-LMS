import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, Users, UserPlus, GraduationCap, ClipboardList,
  Menu, FileText, LogOut, Settings2, MessageSquare, Building2, Eye, Image, X,
  Newspaper, ChevronDown, ChevronRight, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useStudent } from "@/context/student-context";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { startAdminPreview } = useStudent();

  function handlePreviewStudent() {
    startAdminPreview();
    setMobileOpen(false);
    setLocation("/student/dashboard");
  }

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

  const isCmsActive = location.startsWith("/cms");

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Quizzes", href: "/quizzes", icon: ClipboardList },
    { name: "Assignments", href: "/assignments", icon: FileText },
    { name: "Enrollments", href: "/enrollments", icon: UserPlus },
    { name: "Students", href: "/students", icon: Users },
    { name: "Placement", href: "/placement", icon: Target },
    { name: "Media Library", href: "/media", icon: Image },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Lesson Types", href: "/lesson-types", icon: Settings2 },
    { name: "Organization", href: "/organization-settings", icon: Building2 },
  ];

  const cmsSubItems = [
    { name: "Overview",      href: "/cms" },
    { name: "Page Sections", href: "/cms/sections" },
    { name: "Blog & Posts",  href: "/cms/posts" },
    { name: "SEO Settings",  href: "/cms/seo" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d1b60]">
      {/* Logo area */}
      <div className="h-14 flex items-center px-5 bg-[#0a1550] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-[#0d1b60]" />
          </div>
          <div className="leading-tight min-w-0">
            <span className="text-white font-bold text-sm tracking-tight">IELTS</span>
            <span className="text-white/55 font-normal text-sm"> Admin</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              data-testid={`nav-${item.name.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-[#CC0000] text-white"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.name}
              {item.name === "Messages" && unreadMessages > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#CC0000] text-[10px] font-bold">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
          );
        })}

        {/* CMS group */}
        <div>
          <button
            onClick={() => setCmsOpen((o) => !o)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
              isCmsActive
                ? "bg-[#CC0000] text-white"
                : "text-white/65 hover:bg-white/8 hover:text-white"
            )}
          >
            <Newspaper className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Content (CMS)</span>
            {(cmsOpen || isCmsActive)
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
          </button>
          {(cmsOpen || isCmsActive) && (
            <div className="pl-3 mt-0.5 space-y-0.5">
              {cmsSubItems.map((sub) => {
                const isSubActive = location === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors border-l-2 ml-1",
                      isSubActive
                        ? "border-white/60 text-white bg-white/10"
                        : "border-white/15 text-white/55 hover:text-white hover:bg-white/8 hover:border-white/40"
                    )}
                  >
                    {sub.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/10 space-y-0.5 shrink-0 bg-[#0a1550]">
        <button
          onClick={handlePreviewStudent}
          data-testid="btn-preview-student"
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview Student Portal
        </button>
        {user && (
          <>
            <div className="px-3 py-2 border-t border-white/10 mt-1">
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/8 hover:text-red-300 transition-colors"
              onClick={() => { void logout(); }}
              data-testid="btn-logout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-[#0a1550]">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-60 flex flex-col transition-transform duration-200 lg:hidden border-r border-[#0a1550]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="absolute top-3 right-3 z-10">
          <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-12 px-4 bg-[#0d1b60] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-white/70 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#0d1b60]" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">IELTS Admin</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
