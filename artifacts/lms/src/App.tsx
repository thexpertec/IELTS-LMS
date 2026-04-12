import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { StudentLayout } from "@/components/layout/student-layout";
import { StudentProvider, useStudent } from "@/context/student-context";
import { AuthProvider, useAuth } from "@/context/auth-context";
import type { ReactNode } from "react";

// Admin pages
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseNew from "@/pages/course-new";
import CourseDetail from "@/pages/course-detail";
import LessonNew from "@/pages/lesson-new";
import LessonEdit from "@/pages/lesson-edit";
import Enrollments from "@/pages/enrollments";
import EnrollmentNew from "@/pages/enrollment-new";
import Students from "@/pages/students";
import Quizzes from "@/pages/quizzes";
import QuizNew from "@/pages/quiz-new";
import QuizDetail from "@/pages/quiz-detail";
import AdminAssignments from "@/pages/assignments";
import AssignmentNew from "@/pages/assignment-new";
import AssignmentDetail from "@/pages/assignment-detail";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";

// Student quiz pages
import StudentQuizList from "@/pages/student/quiz-list";
import StudentQuizTake from "@/pages/student/quiz-take";

// Student portal pages
import StudentLogin from "@/pages/student/login";
import StudentDashboard from "@/pages/student/dashboard";
import MyCourses from "@/pages/student/my-courses";
import CourseView from "@/pages/student/course-view";
import Assignments from "@/pages/student/assignments";
import StudentNotifications from "@/pages/student/notifications";
import StudentProfile from "@/pages/student/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function StudentGuard({ children }: { children: ReactNode }) {
  const { student } = useStudent();
  if (!student) return <Redirect to="/student" />;
  return <StudentLayout>{children}</StudentLayout>;
}

function StudentGuardNoLayout({ children }: { children: ReactNode }) {
  const { student } = useStudent();
  if (!student) return <Redirect to="/student" />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") return <Redirect to="/admin-login" />;
  return <SidebarLayout>{children}</SidebarLayout>;
}

function Router() {
  return (
    <Switch>
      {/* Admin login */}
      <Route path="/admin-login" component={AdminLogin} />

      {/* Student Portal */}
      <Route path="/student" component={StudentLogin} />
      <Route path="/student/dashboard">
        <StudentGuard><StudentDashboard /></StudentGuard>
      </Route>
      <Route path="/student/courses">
        <StudentGuard><MyCourses /></StudentGuard>
      </Route>
      <Route path="/student/courses/:id">
        <StudentGuard><CourseView /></StudentGuard>
      </Route>
      <Route path="/student/quizzes">
        <StudentGuard><StudentQuizList /></StudentGuard>
      </Route>
      <Route path="/student/quizzes/:id">
        <StudentGuardNoLayout><StudentQuizTake /></StudentGuardNoLayout>
      </Route>
      <Route path="/student/assignments">
        <StudentGuard><Assignments /></StudentGuard>
      </Route>
      <Route path="/student/notifications">
        <StudentGuard><StudentNotifications /></StudentGuard>
      </Route>
      <Route path="/student/profile">
        <StudentGuard><StudentProfile /></StudentGuard>
      </Route>

      {/* Admin area — all protected */}
      <Route path="/">
        <AdminGuard><Dashboard /></AdminGuard>
      </Route>
      <Route path="/courses">
        <AdminGuard><Courses /></AdminGuard>
      </Route>
      <Route path="/courses/new">
        <AdminGuard><CourseNew /></AdminGuard>
      </Route>
      <Route path="/courses/:id">
        <AdminGuard><CourseDetail /></AdminGuard>
      </Route>
      <Route path="/courses/:id/lessons/new">
        <AdminGuard><LessonNew /></AdminGuard>
      </Route>
      <Route path="/courses/:id/lessons/:lessonId/edit">
        <AdminGuard><LessonEdit /></AdminGuard>
      </Route>
      <Route path="/enrollments">
        <AdminGuard><Enrollments /></AdminGuard>
      </Route>
      <Route path="/enrollments/new">
        <AdminGuard><EnrollmentNew /></AdminGuard>
      </Route>
      <Route path="/students">
        <AdminGuard><Students /></AdminGuard>
      </Route>
      <Route path="/quizzes">
        <AdminGuard><Quizzes /></AdminGuard>
      </Route>
      <Route path="/quizzes/new">
        <AdminGuard><QuizNew /></AdminGuard>
      </Route>
      <Route path="/quizzes/:id">
        <AdminGuard><QuizDetail /></AdminGuard>
      </Route>
      <Route path="/assignments">
        <AdminGuard><AdminAssignments /></AdminGuard>
      </Route>
      <Route path="/assignments/new">
        <AdminGuard><AssignmentNew /></AdminGuard>
      </Route>
      <Route path="/assignments/:id">
        <AdminGuard><AssignmentDetail /></AdminGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lms-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <StudentProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </StudentProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
