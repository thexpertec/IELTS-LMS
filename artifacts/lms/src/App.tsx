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

// Tenant landing page
import TenantLanding from "@/pages/tenant-landing";
import PublicCourses from "@/pages/public-courses";

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
import LessonTypesPage from "@/pages/lesson-types";
import Messages from "@/pages/messages";
import OrganizationSettings from "@/pages/organization-settings";
import MediaLibrary from "@/pages/media-library";
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
import StudentMessages from "@/pages/student/messages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function StudentGuard({ children }: { children: ReactNode }) {
  const { student, isAdminPreview } = useStudent();
  if (!student && !isAdminPreview) return <Redirect to="/student/login" />;
  return <StudentLayout>{children}</StudentLayout>;
}

function StudentGuardNoLayout({ children }: { children: ReactNode }) {
  const { student, isAdminPreview } = useStudent();
  if (!student && !isAdminPreview) return <Redirect to="/student/login" />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") return <Redirect to="/admin-login" />;
  return <SidebarLayout>{children}</SidebarLayout>;
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") return <SidebarLayout><Dashboard /></SidebarLayout>;
  return <TenantLanding />;
}

function Router() {
  return (
    <Switch>
      {/* Admin login */}
      <Route path="/admin-login" component={AdminLogin} />

      {/* Student Portal */}
      <Route path="/student/login" component={StudentLogin} />
      <Route path="/student"><Redirect to="/student/login" /></Route>
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
      <Route path="/student/messages">
        <StudentGuard><StudentMessages /></StudentGuard>
      </Route>

      {/* Root — landing page for guests, dashboard for admins */}
      <Route path="/" component={RootRoute} />

      {/* Public courses listing — no auth required */}
      <Route path="/courses-list" component={PublicCourses} />

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
      <Route path="/lesson-types">
        <AdminGuard><LessonTypesPage /></AdminGuard>
      </Route>
      <Route path="/messages">
        <AdminGuard><Messages /></AdminGuard>
      </Route>
      <Route path="/organization-settings">
        <AdminGuard><OrganizationSettings /></AdminGuard>
      </Route>
      <Route path="/media">
        <AdminGuard><MediaLibrary /></AdminGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Detect the effective Wouter base at runtime.
 * In the Replit preview the URL contains the BASE_PATH prefix (e.g. /lms).
 * On a custom domain (e.g. lms.erp360.org) the prefix is stripped by the
 * proxy, so window.location.pathname starts with "/" not "/lms/…".
 * We fall back to "" in that case so all routes still resolve correctly.
 */
function resolveRouterBase(): string {
  const configured = import.meta.env.BASE_URL.replace(/\/$/, ""); // e.g. "/lms"
  if (!configured) return "";
  const { pathname } = window.location;
  if (pathname === configured || pathname.startsWith(configured + "/")) {
    return configured;
  }
  return "";
}

const ROUTER_BASE = resolveRouterBase();

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lms-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <StudentProvider>
              <WouterRouter base={ROUTER_BASE}>
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
