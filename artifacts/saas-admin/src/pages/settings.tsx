import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const config = [
    { label: "Platform Name", value: "IELTS LMS SaaS" },
    { label: "Environment", value: "Production" },
    { label: "API Base URL", value: "/api" },
    { label: "Default Plan", value: "trial" },
    { label: "Max Tenants", value: "Unlimited" },
  ];

  const planLimits = [
    { plan: "Trial", courses: "—", students: "—", duration: "30 days" },
    { plan: "Starter", courses: "10", students: "100", duration: "Monthly" },
    { plan: "Professional", courses: "50", students: "500", duration: "Monthly" },
    { plan: "Enterprise", courses: "200", students: "2,000", duration: "Annual" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform configuration and plan definitions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Configuration</CardTitle>
          <CardDescription>Read-only environment and system settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {config.map((item, i) => (
            <div key={item.label}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium font-mono">{item.value}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Definitions</CardTitle>
          <CardDescription>Limits applied to tenants per subscription plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-muted-foreground font-medium py-2 pr-4">Plan</th>
                  <th className="text-left text-muted-foreground font-medium py-2 pr-4">Max Courses</th>
                  <th className="text-left text-muted-foreground font-medium py-2 pr-4">Max Students</th>
                  <th className="text-left text-muted-foreground font-medium py-2">Billing</th>
                </tr>
              </thead>
              <tbody>
                {planLimits.map((row) => (
                  <tr key={row.plan} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="capitalize">{row.plan}</Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium">{row.courses}</td>
                    <td className="py-3 pr-4 font-medium">{row.students}</td>
                    <td className="py-3 text-muted-foreground">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
