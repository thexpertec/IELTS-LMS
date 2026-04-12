import { useGetTenantStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Database, Server, Globe } from "lucide-react";

export default function PlatformHealth() {
  const { data: stats, isLoading } = useGetTenantStats();

  const services = [
    {
      name: "API Server",
      description: "Core backend service handling all requests",
      icon: Server,
      status: "operational" as const,
    },
    {
      name: "Database",
      description: "PostgreSQL primary instance",
      icon: Database,
      status: "operational" as const,
    },
    {
      name: "Static CDN",
      description: "Frontend asset delivery",
      icon: Globe,
      status: "operational" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Health</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Current status of all platform services.
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
          All systems operational
        </span>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.name}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <service.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.description}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                Operational
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Tenant Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total tenants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">{stats.suspended}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Suspended</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              <div className="text-xs text-muted-foreground mt-0.5">New this month</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
