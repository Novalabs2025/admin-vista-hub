
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, TrendingUp, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PropertyPerformanceOverview = () => {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ["propertyPerformanceOverview"],
    queryFn: async () => {
      const [properties, performance, marketData] = await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .eq("status", "approved"),
        supabase
          .from("property_performance")
          .select("*"),
        supabase
          .from("market_data")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
      ]);

      if (properties.error) throw properties.error;
      if (performance.error) throw performance.error;

      // Calculate overview metrics
      const totalViews = performance.data?.reduce((sum, p) => sum + (p.total_views || 0), 0) || 0;
      const totalInquiries = performance.data?.reduce((sum, p) => sum + (p.inquiry_count || 0), 0) || 0;
      const avgTimeOnPage = performance.data?.length > 0 
        ? Math.round(performance.data.reduce((sum, p) => sum + (p.average_time_on_page || 0), 0) / performance.data.length)
        : 0;

      // Calculate market performance
      const avgMarketPrice = marketData.data?.[0]?.avg_price || 0;
      const avgPropertyPrice = properties.data?.length > 0
        ? properties.data.reduce((sum, p) => sum + Number(p.price), 0) / properties.data.length
        : 0;
      
      const priceComparison = avgMarketPrice > 0 
        ? ((avgPropertyPrice - avgMarketPrice) / avgMarketPrice) * 100
        : 0;

      return {
        totalProperties: properties.data?.length || 0,
        totalViews,
        totalInquiries,
        avgTimeOnPage,
        priceComparison,
        topPerformers: performance.data
          ?.sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
          .slice(0, 3) || []
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              Properties currently listed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalViews.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalInquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Potential buyers interested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.avgTimeOnPage || 0}s</div>
            <p className="text-xs text-muted-foreground">
              Average engagement time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Market Price Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold">
                {overviewData?.priceComparison && overviewData.priceComparison > 0 ? '+' : ''}
                {Math.round(overviewData?.priceComparison || 0)}%
              </div>
              <Badge 
                variant={
                  (overviewData?.priceComparison || 0) > 0 ? "destructive" : "default"
                }
              >
                {(overviewData?.priceComparison || 0) > 0 ? "Above Market" : "Below Market"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your average price vs market average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overviewData?.topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No performance data available</p>
              ) : (
                overviewData?.topPerformers.map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">Property #{property.property_id.slice(-8)}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {property.total_views} views
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyPerformanceOverview;
