import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetTenant, 
  useUpdateTenant, 
  useDeleteTenant,
  getGetTenantQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Building2, Trash2, ExternalLink, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  domain: z.string().min(4, "Domain is required"),
  adminEmail: z.string().email("Valid email is required"),
  adminName: z.string().min(2, "Admin name is required"),
  description: z.string().optional(),
  maxCourses: z.coerce.number().min(1, "Must allow at least 1 course"),
  maxStudents: z.coerce.number().min(1, "Must allow at least 1 student"),
});

type FormValues = z.infer<typeof formSchema>;

export default function TenantDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading, error } = useGetTenant(id, {
    query: {
      enabled: !!id,
    }
  });

  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      domain: "",
      adminEmail: "",
      adminName: "",
      description: "",
      maxCourses: 10,
      maxStudents: 100,
    },
  });

  // Init form
  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        adminEmail: tenant.adminEmail,
        adminName: tenant.adminName,
        description: tenant.description || "",
        maxCourses: tenant.maxCourses,
        maxStudents: tenant.maxStudents,
      });
    }
  }, [tenant, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Tenant Not Found</h2>
        <p className="text-muted-foreground mb-6">The tenant you are looking for does not exist or has been removed.</p>
        <Link href="/tenants" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Back to Tenants
        </Link>
      </div>
    );
  }

  const onSubmit = (data: FormValues) => {
    updateTenant.mutate({ id, data }, {
      onSuccess: (updatedData) => {
        toast({
          title: "Tenant updated",
          description: "Changes have been saved successfully.",
        });
        queryClient.setQueryData(getGetTenantQueryKey(id), updatedData);
      },
      onError: (err: any) => {
        toast({
          title: "Failed to update",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleStatusChange = (newStatus: "active" | "suspended" | "cancelled") => {
    updateTenant.mutate({ id, data: { status: newStatus } }, {
      onSuccess: (updatedData) => {
        toast({
          title: "Status updated",
          description: `Tenant is now ${newStatus}.`,
        });
        queryClient.setQueryData(getGetTenantQueryKey(id), updatedData);
      }
    });
  };

  const handlePlanChange = (newPlan: "trial" | "starter" | "professional" | "enterprise") => {
    updateTenant.mutate({ id, data: { plan: newPlan } }, {
      onSuccess: (updatedData) => {
        toast({
          title: "Plan updated",
          description: `Tenant is now on the ${newPlan} plan.`,
        });
        queryClient.setQueryData(getGetTenantQueryKey(id), updatedData);
      }
    });
  };

  const handleDelete = () => {
    deleteTenant.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "Tenant deleted",
          description: "The tenant has been permanently removed.",
        });
        setLocation("/tenants");
      },
      onError: (err: any) => {
        toast({
          title: "Failed to delete",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/tenants" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border bg-muted/50 flex items-center justify-center shrink-0">
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="w-6 h-6 object-contain" />
              ) : (
                <Building2 className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <a href={`https://${tenant.domain}`} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {tenant.domain}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={tenant.status === "active" ? "default" : tenant.status === "suspended" ? "destructive" : "secondary"} className="capitalize">
            {tenant.status}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {tenant.plan}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Domain</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Internal)</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Administrator Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adminName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxCourses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Courses</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxStudents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Students</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t py-4 flex justify-end">
                  <Button type="submit" disabled={updateTenant.isPending || !form.formState.isDirty}>
                    {updateTenant.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lifecycle Status</label>
                <Select 
                  value={tenant.status} 
                  onValueChange={(val: any) => handleStatusChange(val)}
                  disabled={updateTenant.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Suspending an account instantly revokes access to their LMS instance.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Subscription Plan</label>
                <Select 
                  value={tenant.plan} 
                  onValueChange={(val: any) => handlePlanChange(val)}
                  disabled={updateTenant.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{tenant.createdAt ? format(new Date(tenant.createdAt), "MMM d, yyyy HH:mm") : "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd>{tenant.updatedAt ? format(new Date(tenant.updatedAt), "MMM d, yyyy HH:mm") : "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-mono">{tenant.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this tenant and all associated data. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Delete Tenant</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the tenant <strong>{tenant.name}</strong>, their courses, student accounts, and all related data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
