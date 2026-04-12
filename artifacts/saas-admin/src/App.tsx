import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import TenantList from "@/pages/tenants/list";
import NewTenant from "@/pages/tenants/new";
import TenantDetail from "@/pages/tenants/detail";
import PlatformHealth from "@/pages/health";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "@/context/auth-context";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "saas_admin") return <Redirect to="/login" />;
  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <AuthGuard><Dashboard /></AuthGuard>
      </Route>
      <Route path="/tenants">
        <AuthGuard><TenantList /></AuthGuard>
      </Route>
      <Route path="/tenants/new">
        <AuthGuard><NewTenant /></AuthGuard>
      </Route>
      <Route path="/tenants/:id">
        <AuthGuard><TenantDetail /></AuthGuard>
      </Route>
      <Route path="/health">
        <AuthGuard><PlatformHealth /></AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard><Settings /></AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
