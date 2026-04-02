import { useState } from "react";
import { useIeltsData } from "@/lib/storage";
import { MODULES } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Profile() {
  const { data, updateData } = useIeltsData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: data.profile.name,
    email: data.profile.email,
    bio: data.profile.bio,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...formData
      }
    }));
    toast({
      title: "Profile Updated",
      description: "Your details have been saved successfully."
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const joinedDate = new Date(data.profile.joinedDate).toLocaleDateString(undefined, { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal details and view history.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="w-24 h-24 border-4 border-muted">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(data.profile.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{data.profile.name}</h3>
                <p className="text-sm text-muted-foreground">{data.profile.email || "No email provided"}</p>
                <p className="text-xs text-muted-foreground mt-2">Joined {joinedDate}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your contact details and bio.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    data-testid="input-profile-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    data-testid="input-profile-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Study Goals (Bio)</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="E.g., I need a band 7.5 for university admission..."
                    className="resize-none"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    data-testid="input-profile-bio"
                  />
                </div>
                <Button type="submit" data-testid="btn-save-profile">Save Changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic History</CardTitle>
              <CardDescription>Your progress across all modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {MODULES.map(m => {
                const modProgress = data.progress[m.id];
                const lessons = modProgress?.lessonsCompleted.length || 0;
                const quiz = modProgress && Object.keys(modProgress.quizScores).length > 0 ? 1 : 0;
                const assignment = modProgress?.assignmentsSubmitted.length > 0 ? 1 : 0;
                const total = lessons + quiz + assignment;
                const progressPct = (total / 5) * 100;

                return (
                  <div key={m.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <m.icon className="w-4 h-4 text-muted-foreground" />
                        {m.name}
                      </span>
                      <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                      <span>{lessons}/3 Lessons</span>
                      <span>{quiz}/1 Quiz</span>
                      <span>{assignment}/1 Assignment</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
