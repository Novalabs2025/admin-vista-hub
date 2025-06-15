
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PropertyAnalyticsTable = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["propertyAnalytics"],
    queryFn: async () => {
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          *,
          property_performance (*)
        `)
        .eq("status", "approved");

      if (propertiesError) throw propertiesError;

      return properties?.map(property => ({
        ...property,
        performance: property.property_performance?.[0] || {
          total_views: 0,
          unique_views: 0,
          inquiry_count: 0,
          viewing_requests: 0,
          average_time_on_page: 0,
          demographic_data: null
        }
      })) || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEngagementLevel = (views: number, inquiries: number) => {
    const ratio = views > 0 ? (inquiries / views) * 100 : 0;
    if (ratio >= 5) return { level: "High", color: "bg-green-500" };
    if (ratio >= 2) return { level: "Medium", color: "bg-yellow-500" };
    return { level: "Low", color: "bg-red-500" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Analytics Dashboard</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed performance metrics and demographic insights for your properties
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Total Views</TableHead>
              <TableHead>Unique Views</TableHead>
              <TableHead>Inquiries</TableHead>
              <TableHead>Avg. Time</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Demographics</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyticsData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No property analytics data available.
                </TableCell>
              </TableRow>
            ) : (
              analyticsData?.map((property) => {
                const engagement = getEngagementLevel(
                  property.performance.total_views,
                  property.performance.inquiry_count
                );
                const demographics = property.performance.demographic_data as any;
                
                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.address}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.city}, {property.state}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {property.performance.total_views?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {property.performance.unique_views?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{property.performance.inquiry_count || 0}</span>
                        <Badge variant="outline" className="text-xs">
                          {property.performance.viewing_requests || 0} visits
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.performance.average_time_on_page || 0}s
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${engagement.color}`} />
                        <span className="text-sm">{engagement.level}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {demographics ? (
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">Age:</span> {demographics.avg_age || 'N/A'}
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">Income:</span> ₦{demographics.avg_income?.toLocaleString() || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PropertyAnalyticsTable;
