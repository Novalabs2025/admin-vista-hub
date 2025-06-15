
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Users, FileText, CheckCircle, XCircle, Home } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

type Notification = Tables<'notifications'>;

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'new_agent_pending_approval':
            return <Users className="h-5 w-5 text-secondary-foreground" />;
        case 'agent_rejected':
            return <XCircle className="h-5 w-5 text-red-500" />;
        case 'property_submitted':
            return <Home className="h-5 w-5 text-secondary-foreground" />;
        case 'property_approved':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'property_rejected':
            return <XCircle className="h-5 w-5 text-red-500" />;
        case 'system_update':
            return <Bell className="h-5 w-5 text-secondary-foreground" />;
        default:
            return <FileText className="h-5 w-5 text-secondary-foreground" />;
    }
};

const NotificationsFeed = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: notifications, isLoading, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: async (): Promise<Notification[]> => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }
            return data || [];
        },
    });

    useEffect(() => {
        const channel = supabase
          .channel('realtime-notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
            },
            (payload) => {
              console.log('New notification received!', payload);
              toast({
                title: "New Notification",
                description: (payload.new as Notification).title,
              });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
          )
          .subscribe();
    
        return () => {
          supabase.removeChannel(channel);
        };
      }, [queryClient, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Recent system events and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 rounded-lg border">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="grid gap-2 flex-1">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="text-red-500 text-center">Error fetching notifications.</div>
                ) : notifications && notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg border">
                            <Avatar className="h-9 w-9 flex items-center justify-center bg-secondary">
                               {getNotificationIcon(notification.type)}
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-sm text-muted-foreground">{notification.description}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground">No new notifications.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default NotificationsFeed;
