import { useListQuizzes, useDeleteQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Trash2, Edit, ClipboardList, Timer, BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Quizzes() {
  const { data: quizzes, isLoading } = useListQuizzes({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteQuiz = useDeleteQuiz({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        toast({ title: "Quiz deleted" });
      },
      onError: () => toast({ title: "Failed to delete quiz", variant: "destructive" }),
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Create and manage interactive quizzes for your courses.</p>
        </div>
        <Link href="/quizzes/new">
          <Button data-testid="btn-create-quiz">
            <Plus className="w-4 h-4 mr-2" />
            New Quiz
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : quizzes?.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card/50 border-dashed">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No quizzes yet</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Create your first quiz with multiple question types.
          </p>
          <Link href="/quizzes/new">
            <Button data-testid="btn-empty-create-quiz">Create Quiz</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="list-quizzes">
          {quizzes?.map((quiz) => (
            <Card
              key={quiz.id}
              className="flex flex-col hover:border-primary/50 transition-colors"
              data-testid={`card-quiz-${quiz.id}`}
            >
              <CardHeader className="flex-1 pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                        {quiz.isPublished ? (
                          <><Eye className="w-3 h-3 mr-1" /> Published</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                      <button
                        onClick={async () => {
                          const isPaid = (quiz as typeof quiz & { enrollmentType?: string }).enrollmentType === "paid";
                          await fetch(`/api/quizzes/${quiz.id}`, {
                            method: "PUT",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ enrollmentType: isPaid ? "free" : "paid" }),
                          });
                          queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
                        }}
                        title={(quiz as typeof quiz & { enrollmentType?: string }).enrollmentType === "paid" ? "Click to make Free" : "Click to make Paid"}
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
                          (quiz as typeof quiz & { enrollmentType?: string }).enrollmentType === "paid"
                            ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                            : "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        )}
                      >
                        {(quiz as typeof quiz & { enrollmentType?: string }).enrollmentType === "paid" ? "Paid" : "Free"}
                      </button>
                    </div>
                    <CardTitle className="text-lg line-clamp-1 mt-2">{quiz.title}</CardTitle>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description.replace(/<[^>]*>/g, "")}</p>
                    )}
                  </div>
                </div>
                <CardContent className="px-0 pb-0 pt-3">
                  <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}
                    </span>
                    {quiz.timeLimitMinutes && (
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {quiz.timeLimitMinutes} min
                      </span>
                    )}
                    {quiz.courseId && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Course #{quiz.courseId}
                      </span>
                    )}
                  </div>
                </CardContent>
              </CardHeader>

              <CardFooter className="gap-2 pt-0">
                <Link href={`/quizzes/${quiz.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full" data-testid={`btn-manage-quiz-${quiz.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" data-testid={`btn-delete-quiz-${quiz.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{quiz.title}"? This will also delete all questions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteQuiz.mutate({ id: quiz.id })}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
