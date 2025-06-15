
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const [properties, agents, payments] = await Promise.all([
        supabase
          .from("properties")
          .select("id, address, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("agent_verifications")
          .select("id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("payments")
          .select("id, amount, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      const activities = [
        ...(properties.data || []).map(p => ({
          id: p.id,
          type: "property",
          description: `New property: ${p.address}`,
          status: p.status,
          timestamp: p.created_at
        })),
        ...(agents.data || []).map(a => ({
          id: a.id,
          type: "agent",
          description: "Agent verification request",
          status: a.status,
          timestamp: a.created_at
        })),
        ...(payments.data || []).map(p => ({
          id: p.id,
          type: "payment",
          description: `Payment of ₦${p.amount.toLocaleString()}`,
          status: p.status,
          timestamp: p.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      return activities;
    },
  });

  const getActivityBadge = (type: string, status: string) => {
    const variants: Record<string, any> = {
      property: status === "approved" ? "default" : "secondary",
      agent: status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive",
      payment: status === "Paid" ? "default" : "secondary"
    };
    
    return (
      <Badge variant={variants[type]} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities?.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
            {getActivityBadge(activity.type, activity.status)}
          </div>
        ))}
        {(!activities || activities.length === 0) && (
          <p className="text-center text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
