import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthModalProvider } from "@/components/auth-modal";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CoursesPage from "@/pages/courses-listing";
import CourseDetail from "@/pages/course-detail";
import CheckoutPage from "@/pages/checkout";
import BlogPage from "@/pages/blog";
import BlogPost from "@/pages/blog-post";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/courses/:slug" component={CourseDetail} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/login">
        {() => { window.location.replace("/lms/"); return null; }}
      </Route>
      <Route path="/lms">
        {() => { window.location.replace("/lms/"); return null; }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthModalProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthModalProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
