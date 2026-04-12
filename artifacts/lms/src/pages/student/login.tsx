import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, Mail, Lock, ArrowRight, BookOpen, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudent } from "@/context/student-context";


export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const { student, login } = useStudent();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (student) {
    setLocation("/student/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      setLocation("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
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
              <CardDescription>Enter your credentials to access the student portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { void handleLogin(e); }} className="space-y-4">
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
                      autoComplete="email"
                      data-testid="input-student-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      data-testid="input-student-password"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full gap-2" disabled={loading} data-testid="btn-student-login">
                  {loading ? "Signing in…" : "Sign In"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
