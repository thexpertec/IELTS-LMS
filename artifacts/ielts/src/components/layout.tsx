import { Link, useLocation } from "wouter";
import { useIeltsData } from "@/lib/storage";
import {
  BookOpen,
  LayoutDashboard,
  User,
  Bell,
  LogOut,
  Menu,
  GraduationCap,
  PenTool,
  Headphones,
  Mic,
  FileText,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export const MODULES = [
  { id: "reading", name: "Reading", icon: BookOpen },
  { id: "writing", name: "Writing", icon: PenTool },
  { id: "listening", name: "Listening", icon: Headphones },
  { id: "speaking", name: "Speaking", icon: Mic },
  { id: "grammar", name: "Grammar", icon: FileText },
  { id: "vocabulary", name: "Vocabulary", icon: Type },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data, updateData } = useIeltsData();

  if (!data.session.loggedIn) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    updateData((prev) => ({
      ...prev,
      session: { loggedIn: false },
    }));
    setLocation("/");
  };

  const unreadCount = data.notifications.filter((n) => !n.read).length;

  const NavItems = () => (
    <>
      <div className="space-y-1">
        <Button
          variant={location === "/dashboard" ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link href="/dashboard" data-testid="nav-dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="pt-4 pb-2">
        <h4 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
          Modules
        </h4>
        <div className="space-y-1">
          {MODULES.map((m) => (
            <Button
              key={m.id}
              variant={location === `/module/${m.id}` ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={`/module/${m.id}`} data-testid={`nav-module-${m.id}`}>
                <m.icon className="mr-2 h-4 w-4" />
                {m.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="pt-4 pb-2">
        <h4 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
          Account
        </h4>
        <div className="space-y-1">
          <Button
            variant={location === "/profile" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/profile" data-testid="nav-profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Button
            variant={location === "/notifications" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/notifications" data-testid="nav-notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            data-testid="nav-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r bg-card w-64 flex-col lg:flex sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-2 border-b">
          <div className="p-2 bg-primary/10 rounded-md">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg">IELTS Masterclass</span>
        </div>
        <div className="flex-1 p-4">
          <NavItems />
        </div>
        <div className="p-4 border-t text-sm text-muted-foreground">
          <div className="font-medium text-foreground truncate">{data.profile.name}</div>
          <div className="truncate text-xs">{data.profile.email || "No email set"}</div>
        </div>
      </aside>

      {/* Mobile Nav & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 border-b bg-card flex items-center px-4 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-bold">IELTS</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <div className="p-6 border-b">
                <span className="font-bold text-lg">IELTS Masterclass</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
