
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OverviewChart from "./OverviewChart";
import AnalyticsKPIs from "./AnalyticsKPIs";
import RecentActivity from "./RecentActivity";

const AnalyticsOverview = () => {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: async () => {
      const [dailyData, totalStats] = await Promise.all([
        supabase
          .from("analytics_daily")
          .select("*")
          .order("date", { ascending: true })
          .limit(30),
        supabase.rpc("get_platform_totals")
      ]);

      if (dailyData.error) throw dailyData.error;
      
      return {
        dailyAnalytics: dailyData.data || [],
        totalStats: totalStats.data || {}
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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsKPIs data={overviewData?.totalStats} />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <OverviewChart data={overviewData?.dailyAnalytics || []} />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
};

export default AnalyticsOverview;
