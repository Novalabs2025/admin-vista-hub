
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, CheckCircle, XCircle, Home, CreditCard, Bell } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Notification = Tables<'notifications'>;

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'new_agent_pending_approval':
      return <Users className="h-5 w-5 text-blue-500" />;
    case 'property_submitted':
      return <Home className="h-5 w-5 text-yellow-500" />;
    case 'property_approved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'property_rejected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'agent_rejected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'payment_success':
      return <CreditCard className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationBadge = (type: Notification['type']) => {
  switch (type) {
    case 'new_agent_pending_approval':
      return <Badge variant="secondary">Approval Required</Badge>;
    case 'property_submitted':
      return <Badge variant="outline">Submission</Badge>;
    case 'property_approved':
      return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
    case 'property_rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'agent_rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'payment_success':
      return <Badge variant="default" className="bg-green-100 text-green-800">Payment</Badge>;
    default:
      return <Badge variant="outline">System</Badge>;
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  return (
    <Card className={cn(
      "p-4 transition-all duration-200 hover:shadow-md",
      !notification.read ? "bg-blue-50 border-blue-200" : "bg-white"
    )}>
      <div className="flex items-start gap-4">
        <Avatar className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {getNotificationIcon(notification.type)}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={cn(
              "font-medium text-sm",
              !notification.read ? "font-semibold" : ""
            )}>
              {notification.title}
            </h4>
            {getNotificationBadge(notification.type)}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {notification.description}
          </p>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
            
            {!notification.read && (
              <Button 
                onClick={() => onMarkAsRead(notification.id)}
                variant="ghost" 
                size="sm"
                className="text-xs h-7 px-3"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
        
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
        )}
      </div>
    </Card>
  );
};

export default NotificationItem;
