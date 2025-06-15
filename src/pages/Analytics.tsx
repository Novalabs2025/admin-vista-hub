
import Header from "@/components/dashboard/Header";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import RevenueAnalytics from "@/components/analytics/RevenueAnalytics";
import AgentPerformance from "@/components/analytics/AgentPerformance";
import MarketTrends from "@/components/analytics/MarketTrends";
import PropertyAnalytics from "@/components/analytics/PropertyAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analytics = () => {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and performance metrics
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <AnalyticsOverview />
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-6">
            <RevenueAnalytics />
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-6">
            <AgentPerformance />
          </TabsContent>
          
          <TabsContent value="market" className="space-y-6">
            <MarketTrends />
          </TabsContent>
          
          <TabsContent value="properties" className="space-y-6">
            <PropertyAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
