import { Link, useLocation } from "wouter";
import { BookOpen, Home, FileText, Bell, User, LogOut, GraduationCap, Sun, Moon, ClipboardList } from "lucide-react";
import { useStudent } from "@/context/student-context";
import { useGetStudentNotifications } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import type { ReactNode } from "react";

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: Home },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/student/assignments", label: "Assignments", icon: FileText },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
  { href: "/student/profile", label: "Profile", icon: User },
];

export function StudentLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { student, logout } = useStudent();
  const { theme, setTheme } = useTheme();

  const { data: notifications } = useGetStudentNotifications(
    { email: student?.email ?? "" },
    { query: { enabled: !!student?.email } }
  );

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const initials = student?.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r bg-card flex flex-col flex-shrink-0">
        <div className="p-5 border-b">
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
          <div className="p-4 border-b">
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
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-1">
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
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
