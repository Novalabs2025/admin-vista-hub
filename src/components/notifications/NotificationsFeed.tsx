
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Users, FileText, CheckCircle, XCircle, Home } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

type Notification = Tables<'notifications'>;

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'new_agent_pending_approval':
      return <Users className="h-5 w-5" />;
    case 'property_submitted':
      return <Home className="h-5 w-5" />;
    case 'property_approved':
      return <CheckCircle className="h-5 w-5" />;
    case 'property_rejected':
      return <XCircle className="h-5 w-5" />;
    case 'agent_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const NotificationsFeed = () => {
    const { notifications, isLoading, error } = useNotifications();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Recent events and updates from the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                    ) : error ? (
                        <div className="text-red-500">Error loading notifications.</div>
                    ) : notifications && notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div key={notification.id} className="flex items-start gap-4">
                                <Avatar className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    {getNotificationIcon(notification.type)}
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <Bell className="mx-auto h-12 w-12" />
                            <p className="mt-4">No notifications yet.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default NotificationsFeed;
