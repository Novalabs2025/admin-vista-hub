
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

type Notification = Tables<'notifications'>;

interface NotificationFiltersProps {
  filterType: string;
  filterStatus: string;
  onFilterTypeChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onMarkAllRead: () => void;
  unreadCount: number;
}

const NotificationFilters = ({
  filterType,
  filterStatus,
  onFilterTypeChange,
  onFilterStatusChange,
  onMarkAllRead,
  unreadCount
}: NotificationFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="new_agent_pending_approval">Agent Approvals</SelectItem>
            <SelectItem value="property_submitted">Property Submissions</SelectItem>
            <SelectItem value="property_approved">Property Approved</SelectItem>
            <SelectItem value="property_rejected">Property Rejected</SelectItem>
            <SelectItem value="agent_rejected">Agent Rejected</SelectItem>
            <SelectItem value="payment_success">Payment Success</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        {unreadCount > 0 && (
          <Badge variant="destructive" className="px-2 py-1">
            {unreadCount} Unread
          </Badge>
        )}
        <Button 
          onClick={onMarkAllRead} 
          variant="outline" 
          size="sm"
          disabled={unreadCount === 0}
        >
          Mark All Read
        </Button>
      </div>
    </div>
  );
};

export default NotificationFilters;
