import { useIeltsData } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Info, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function Notifications() {
  const { data, updateData } = useIeltsData();

  const handleMarkAsRead = (id: string) => {
    updateData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  const handleMarkAllAsRead = () => {
    updateData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "reminder": return <Clock className="w-5 h-5 text-blue-500" />;
      case "info": 
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  // Sort newest first
  const sortedNotifications = [...data.notifications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const unreadCount = data.notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-2">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} data-testid="btn-mark-all-read">
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
              No notifications yet.
            </CardContent>
          </Card>
        ) : (
          sortedNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`transition-colors cursor-pointer hover:bg-muted/50 ${!notif.read ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-70'}`}
              onClick={() => !notif.read && handleMarkAsRead(notif.id)}
              data-testid={`notification-${notif.id}`}
            >
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm font-medium ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(notif.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
