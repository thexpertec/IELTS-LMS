import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, Mail, User, ArrowRight, BookOpen, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudent } from "@/context/student-context";
import { useGetStudentProfile } from "@workspace/api-client-react";

const DEMO_STUDENTS = [
  { email: "alice@example.com", name: "Alice Johnson" },
  { email: "bob@example.com", name: "Bob Smith" },
  { email: "carol@example.com", name: "Carol White" },
  { email: "david@example.com", name: "David Lee" },
];

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const { student, login } = useStudent();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  if (student) {
    setLocation("/student/dashboard");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const displayName = name.trim() || email.split("@")[0];
    login(email.trim(), displayName);
    setLocation("/student/dashboard");
  };

  const handleDemoLogin = (demoEmail: string, demoName: string) => {
    login(demoEmail, demoName);
    setLocation("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Student Portal</h1>
              <p className="text-muted-foreground text-sm">LMS Learning Platform</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Continue your<br />
              <span className="text-primary">learning journey</span>
            </h2>
            <p className="text-muted-foreground">
              Access your courses, track progress, complete assignments, and connect with fellow learners.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-card border">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Course Access</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Track Progress</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border">
              <Award className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Earn Badges</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your email to access the student portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-student-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name (optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      className="pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="input-student-name"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" data-testid="btn-student-login">
                  Enter Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Demo Access</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 grid grid-cols-2 gap-2">
              {DEMO_STUDENTS.map((s) => (
                <Button
                  key={s.email}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-9"
                  onClick={() => handleDemoLogin(s.email, s.name)}
                  data-testid={`btn-demo-${s.email}`}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {s.name[0]}
                  </div>
                  <span className="truncate text-xs">{s.name.split(" ")[0]}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
