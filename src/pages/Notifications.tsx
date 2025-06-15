
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, TrendingUp, Users, FileText } from 'lucide-react';
import NotificationsFeed from "@/components/notifications/NotificationsFeed";
import { useNotifications } from "@/hooks/useNotifications";

const Notifications = () => {
  const { notifications } = useNotifications();
  
  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const todayCount = notifications?.filter(n => 
    new Date(n.created_at).toDateString() === new Date().toDateString()
  ).length || 0;
  const agentNotifications = notifications?.filter(n => 
    n.type === 'new_agent_pending_approval' || n.type === 'agent_rejected'
  ).length || 0;
  const propertyNotifications = notifications?.filter(n => 
    n.type === 'property_submitted' || n.type === 'property_approved' || n.type === 'property_rejected'
  ).length || 0;

  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              New notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Related</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Agent actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Related</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertyNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Property updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Feed */}
      <NotificationsFeed />
    </main>
  );
};

export default Notifications;
