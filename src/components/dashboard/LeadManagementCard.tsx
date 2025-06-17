
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const LeadManagementCard = () => {
  const { data: leadStats, isLoading } = useQuery({
    queryKey: ["leadManagementStats"],
    queryFn: async () => {
      const [newLeads, contactedLeads, qualifiedLeads, convertedLeads] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "contacted"),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "qualified"),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "converted"),
      ]);

      return {
        newLeads: newLeads.count || 0,
        contacted: contactedLeads.count || 0,
        qualified: qualifiedLeads.count || 0,
        converted: convertedLeads.count || 0,
      };
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const totalLeads = (leadStats?.newLeads || 0) + (leadStats?.contacted || 0) + 
                    (leadStats?.qualified || 0) + (leadStats?.converted || 0);

  const conversionRate = totalLeads > 0 ? ((leadStats?.converted || 0) / totalLeads * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lead Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New</span>
              <Badge variant="secondary">{leadStats?.newLeads || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contacted</span>
              <Badge variant="outline">{leadStats?.contacted || 0}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Qualified</span>
              <Badge className="bg-blue-100 text-blue-800">{leadStats?.qualified || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Converted</span>
              <Badge className="bg-green-100 text-green-800">{leadStats?.converted || 0}</Badge>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Conversion Rate</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold">{conversionRate}%</span>
            </div>
          </div>
          <Button asChild className="w-full" size="sm">
            <Link to="/crm">
              <Users className="h-4 w-4 mr-2" />
              Manage Leads
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadManagementCard;
