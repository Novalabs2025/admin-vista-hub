
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from 'lucide-react';
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationActions } from "@/hooks/useNotificationActions";
import NotificationFilters from "./NotificationFilters";
import NotificationItem from "./NotificationItem";

type Notification = Tables<'notifications'>;

const NotificationsFeed = () => {
  const { notifications, isLoading, error } = useNotifications();
  const { markAsRead, markAllAsRead } = useNotificationActions();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    
    return notifications.filter(notification => {
      const typeMatch = filterType === "all" || notification.type === filterType;
      const statusMatch = filterStatus === "all" || 
        (filterStatus === "read" && notification.read) ||
        (filterStatus === "unread" && !notification.read);
      
      return typeMatch && statusMatch;
    });
  }, [notifications, filterType, filterStatus]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent events and updates from the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent events and updates from the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            <Bell className="mx-auto h-12 w-12 mb-4" />
            <p>Error loading notifications. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        <CardDescription>Recent events and updates from the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <NotificationFilters
            filterType={filterType}
            filterStatus={filterStatus}
            onFilterTypeChange={setFilterType}
            onFilterStatusChange={setFilterStatus}
            onMarkAllRead={markAllAsRead}
            unreadCount={unreadCount}
          />

          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            ) : notifications && notifications.length > 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No notifications match the current filters.</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No notifications yet.</p>
                <p className="text-sm mt-2">You'll see updates and alerts here when they arrive.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsFeed;
