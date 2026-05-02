import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Settings, Activity, LogOut, Globe, FileText, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Tenants", href: "/tenants", icon: Users },
    { name: "Platform Health", href: "/health", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const cmsNavigation = [
    { name: "CMS Overview", href: "/cms", icon: LayoutGrid, exact: true },
    { name: "Page Sections", href: "/cms/sections", icon: Globe },
    { name: "Blog Posts", href: "/cms/posts", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-64 border-r bg-card flex-col hidden md:flex">
        <div className="h-14 flex items-center px-6 border-b">
          <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
            </div>
            SaaS Admin
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pb-1">Platform</p>
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pb-1">Website Content</p>
            {cmsNavigation.map((item) => {
              const isActive = item.exact
                ? location === item.href
                : location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">Logged in as Operator</div>
          <div className="text-xs font-medium text-foreground mt-0.5 truncate">{user?.email ?? "—"}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-muted-foreground h-8 px-2 text-xs"
            onClick={() => { void logout(); }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b bg-card flex items-center px-6 md:hidden">
          <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
            </div>
            SaaS Admin
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
