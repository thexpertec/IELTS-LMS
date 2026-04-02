import {
  useGetStudentNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getGetStudentNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, Info, CheckCircle, AlertTriangle, Megaphone, CheckCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

type NotifType = "info" | "success" | "warning" | "announcement";

function notifIcon(type: NotifType) {
  switch (type) {
    case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "announcement": return <Megaphone className="w-4 h-4 text-primary" />;
    default: return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function notifBadgeVariant(type: NotifType): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "success": return "default";
    case "warning": return "destructive";
    default: return "secondary";
  }
}

function notifBadgeClass(type: NotifType) {
  switch (type) {
    case "success": return "bg-green-500 text-white";
    case "warning": return "bg-orange-500 text-white";
    case "announcement": return "bg-primary text-primary-foreground";
    default: return "";
  }
}

export default function Notifications() {
  const { student } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useGetStudentNotifications(
    { email },
    { query: { enabled: !!email } }
  );
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getGetStudentNotificationsQueryKey({ email }) });
    } catch {
      toast({ title: "Error", description: "Could not mark as read.", variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAll.mutateAsync({ data: { email } });
      await queryClient.invalidateQueries({ queryKey: getGetStudentNotificationsQueryKey({ email }) });
      toast({ title: "Done", description: "All notifications marked as read." });
    } catch {
      toast({ title: "Error", description: "Could not update notifications.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay up to date with your courses and assignments.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4" />
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : notifications?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-lg">No notifications</p>
            <p className="text-muted-foreground text-sm">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all ${!notif.isRead ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    {notifIcon(notif.type as NotifType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge className={`text-xs ${notifBadgeClass(notif.type as NotifType)}`}>
                          {notif.type}
                        </Badge>
                        {!notif.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleMarkRead(notif.id)}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
