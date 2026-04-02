import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

// Pages
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseNew from "@/pages/course-new";
import CourseDetail from "@/pages/course-detail";
import LessonNew from "@/pages/lesson-new";
import Enrollments from "@/pages/enrollments";
import EnrollmentNew from "@/pages/enrollment-new";
import Students from "@/pages/students";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function Router() {
  return (
    <SidebarLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/new" component={CourseNew} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/courses/:id/lessons/new" component={LessonNew} />
        <Route path="/enrollments" component={Enrollments} />
        <Route path="/enrollments/new" component={EnrollmentNew} />
        <Route path="/students" component={Students} />
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lms-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;