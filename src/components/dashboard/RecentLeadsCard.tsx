
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Phone, Mail, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const RecentLeadsCard = () => {
  const { data: recentLeads, isLoading } = useQuery({
    queryKey: ["recentLeads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!recentLeads || recentLeads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No recent leads</p>
            <p className="text-sm mt-2">New leads will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{lead.client_name}</h4>
                    <p className="text-xs text-gray-500">
                      {format(new Date(lead.created_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  {lead.client_phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="h-3 w-3" />
                      {lead.client_phone}
                    </div>
                  )}
                  {lead.location_interest && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {lead.location_interest}
                    </div>
                  )}
                  {lead.budget && (
                    <div className="text-xs text-gray-600">
                      Budget: {lead.budget}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentLeadsCard;
