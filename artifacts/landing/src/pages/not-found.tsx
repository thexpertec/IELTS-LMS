import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    // If the path doesn't already start with /lms, redirect there.
    // This handles the case where lms.erp360.org/some-lms-path is visited
    // directly — the domain maps to the whole deployment root, so any
    // LMS-specific path hits the landing page's 404 first.
    if (!pathname.startsWith("/lms")) {
      window.location.replace("/lms" + pathname + search + hash);
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
