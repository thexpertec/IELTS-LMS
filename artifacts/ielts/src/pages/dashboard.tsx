import { Link } from "wouter";
import { useIeltsData } from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/components/layout";
import { CalendarClock, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { data } = useIeltsData();

  const getModuleProgress = (moduleId: string) => {
    const modProgress = data.progress[moduleId];
    if (!modProgress) return 0;
    
    const lessons = modProgress.lessonsCompleted.length;
    const quiz = Object.keys(modProgress.quizScores).length > 0 ? 1 : 0;
    const assignment = modProgress.assignmentsSubmitted.length > 0 ? 1 : 0;
    
    return ((lessons + quiz + assignment) / 5) * 100;
  };

  const totalItemsCompleted = Object.values(data.progress).reduce((acc, curr) => {
    const lessons = curr.lessonsCompleted.length;
    const quiz = Object.keys(curr.quizScores).length > 0 ? 1 : 0;
    const assignment = curr.assignmentsSubmitted.length > 0 ? 1 : 0;
    return acc + lessons + quiz + assignment;
  }, 0);

  const overallProgress = (totalItemsCompleted / 30) * 100;

  const unreadNotifications = data.notifications.filter(n => !n.read).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {data.profile.name}!</h1>
        <p className="text-muted-foreground mt-2">Ready to continue your IELTS preparation?</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{totalItemsCompleted} of 30 items completed</span>
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" data-testid="overall-progress" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <h2 className="text-xl font-semibold">Your Modules</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {MODULES.map((m) => {
              const progress = getModuleProgress(m.id);
              return (
                <Card key={m.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <m.icon className="w-4 h-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{m.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" data-testid={`module-progress-${m.id}`} />
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button className="w-full" variant={progress === 0 ? "default" : "secondary"} asChild>
                      <Link href={`/module/${m.id}`} data-testid={`btn-start-${m.id}`}>
                        {progress === 0 ? "Start Module" : "Continue"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted rounded-md p-2 min-w-[50px]">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">TMRW</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Writing Assignment</p>
                    <p className="text-xs text-muted-foreground">Task 1 description</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted rounded-md p-2 min-w-[50px]">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">FRI</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Grammar Quiz</p>
                    <p className="text-xs text-muted-foreground">Passive Voice</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {unreadNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unreadNotifications.map(n => (
                    <div key={n.id} className="space-y-1">
                      <p className="font-medium text-sm leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-xs p-0 h-auto text-primary" asChild>
                    <Link href="/notifications">View all notifications</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
