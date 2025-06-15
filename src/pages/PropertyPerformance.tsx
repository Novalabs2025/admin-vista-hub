
import Header from "@/components/dashboard/Header";
import PropertyPerformanceOverview from "@/components/property-performance/PropertyPerformanceOverview";
import PropertyAnalyticsTable from "@/components/property-performance/PropertyAnalyticsTable";
import MarketComparisonChart from "@/components/property-performance/MarketComparisonChart";
import PriceOptimizationSuggestions from "@/components/property-performance/PriceOptimizationSuggestions";
import PerformanceForecasting from "@/components/property-performance/PerformanceForecasting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PropertyPerformance = () => {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Property Performance Tracker</h1>
            <p className="text-muted-foreground">
              Advanced analytics, market insights, and optimization tools for your properties
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="market">Market Compare</TabsTrigger>
            <TabsTrigger value="pricing">Price Optimization</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <PropertyPerformanceOverview />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <PropertyAnalyticsTable />
          </TabsContent>
          
          <TabsContent value="market" className="space-y-6">
            <MarketComparisonChart />
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-6">
            <PriceOptimizationSuggestions />
          </TabsContent>
          
          <TabsContent value="forecasting" className="space-y-6">
            <PerformanceForecasting />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PropertyPerformance;
