import { useState } from "react";
import { useLocation } from "wouter";
import { useIeltsData } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function Login() {
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const { data, updateData } = useIeltsData();

  if (data.session.loggedIn) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateData({
      ...data,
      profile: { ...data.profile, name },
      session: { loggedIn: true },
    });
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">IELTS Masterclass</CardTitle>
          <CardDescription>
            Enter your name to begin your preparation journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                data-testid="input-login-name"
                placeholder="e.g. Sarah Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button data-testid="button-login-submit" type="submit" className="w-full">
              Start Learning
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
