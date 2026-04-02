import { useListQuizzes } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ClipboardList, Timer, Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentQuizList() {
  const { data: quizzes, isLoading } = useListQuizzes({});
  const published = quizzes?.filter((q) => q.isPublished) ?? [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Practice Quizzes</h1>
        <p className="text-muted-foreground mt-1">Select a quiz to begin. Your answers will not be saved between sessions.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
              <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : published.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card/50 border-dashed">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">No quizzes available</h3>
          <p className="text-sm text-muted-foreground mt-2">Check back later for practice quizzes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {published.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">{quiz.title}</CardTitle>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{quiz.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    <ClipboardList className="w-3 h-3 mr-1" />
                    {quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}
                  </Badge>
                  {quiz.timeLimitMinutes ? (
                    <Badge variant="outline" className="text-xs">
                      <Timer className="w-3 h-3 mr-1" />
                      {quiz.timeLimitMinutes} min
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">No time limit</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 mt-auto">
                <Link href={`/student/quizzes/${quiz.id}`} className="w-full">
                  <Button className="w-full" data-testid={`btn-start-quiz-${quiz.id}`}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Quiz
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
