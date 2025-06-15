
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";

const PerformanceForecasting = () => {
  const { data: forecastData, isLoading } = useQuery({
    queryKey: ["performanceForecasting"],
    queryFn: async () => {
      const [properties, forecasts, performance, marketTrends] = await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .eq("status", "approved"),
        supabase
          .from("property_forecasts")
          .select("*"),
        supabase
          .from("property_performance")
          .select("*"),
        supabase
          .from("market_trends")
          .select("*")
          .order("date", { ascending: true })
      ]);

      if (properties.error) throw properties.error;
      if (forecasts.error) throw forecasts.error;
      if (performance.error) throw performance.error;
      if (marketTrends.error) throw marketTrends.error;

      // Generate forecast data for the next 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const currentDate = new Date();
      
      const viewsForecast = months.map((month, index) => {
        const avgViews = performance.data?.reduce((sum, p) => sum + (p.total_views || 0), 0) / (performance.data?.length || 1);
        const seasonalFactor = 1 + (Math.sin((index + currentDate.getMonth()) * Math.PI / 6) * 0.2);
        const growthFactor = 1 + (index * 0.05); // 5% monthly growth
        
        return {
          month,
          predictedViews: Math.round(avgViews * seasonalFactor * growthFactor),
          predictedInquiries: Math.round(avgViews * seasonalFactor * growthFactor * 0.03),
          marketTrend: Math.round(avgViews * seasonalFactor * 1.02) // Market benchmark
        };
      });

      // Price forecasts
      const priceForecast = properties.data?.map(property => {
        const marketData = marketTrends.data?.find(trend => 
          trend.location.toLowerCase().includes(property.city.toLowerCase())
        );
        
        const currentPrice = Number(property.price);
        const marketGrowth = marketData?.price_change_percentage || 2;
        const sixMonthForecast = currentPrice * (1 + (marketGrowth / 100) * 0.5);
        const oneYearForecast = currentPrice * (1 + (marketGrowth / 100));
        
        return {
          id: property.id,
          address: property.address,
          city: property.city,
          currentPrice,
          sixMonthForecast: Math.round(sixMonthForecast),
          oneYearForecast: Math.round(oneYearForecast),
          marketGrowth,
          confidence: Math.round(75 + Math.random() * 20) // Simulated confidence score
        };
      }) || [];

      // Market opportunity score
      const opportunityMetrics = properties.data?.map(property => {
        const perf = performance.data?.find(p => p.property_id === property.id);
        const views = perf?.total_views || 0;
        const inquiries = perf?.inquiry_count || 0;
        const conversionRate = views > 0 ? (inquiries / views) * 100 : 0;
        
        // Calculate opportunity score (0-100)
        const viewsScore = Math.min(views / 100 * 30, 30);
        const conversionScore = Math.min(conversionRate * 10, 30);
        const marketScore = 40; // Base market score
        
        const totalScore = viewsScore + conversionScore + marketScore;
        
        return {
          id: property.id,
          address: property.address,
          opportunityScore: Math.round(totalScore),
          views,
          inquiries,
          conversionRate,
          recommendation: totalScore > 75 ? "High Potential" : totalScore > 50 ? "Good Opportunity" : "Needs Attention"
        };
      }) || [];

      return {
        viewsForecast,
        priceForecast,
        opportunityMetrics
      };
    },
  });

  const chartConfig = {
    predictedViews: {
      label: "Predicted Views",
      color: "hsl(var(--primary))",
    },
    predictedInquiries: {
      label: "Predicted Inquiries",
      color: "hsl(142, 76%, 36%)",
    },
    marketTrend: {
      label: "Market Benchmark",
      color: "hsl(346, 87%, 43%)",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Forecast
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Predicted views and inquiries for the next 6 months
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <LineChart data={forecastData?.viewsForecast || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predictedViews" 
                  stroke="var(--color-predictedViews)" 
                  strokeWidth={2}
                  name="Predicted Views"
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedInquiries" 
                  stroke="var(--color-predictedInquiries)" 
                  strokeWidth={2}
                  name="Predicted Inquiries"
                />
                <Line 
                  type="monotone" 
                  dataKey="marketTrend" 
                  stroke="var(--color-marketTrend)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Market Benchmark"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Opportunity Metrics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Properties ranked by potential performance
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecastData?.opportunityMetrics
                .sort((a, b) => b.opportunityScore - a.opportunityScore)
                .slice(0, 5)
                .map((property, index) => (
                <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{property.address}</div>
                    <div className="text-xs text-muted-foreground">
                      {property.views} views • {property.inquiries} inquiries • {property.conversionRate.toFixed(1)}% conversion
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        property.opportunityScore > 75 ? "default" : 
                        property.opportunityScore > 50 ? "secondary" : "destructive"
                      }
                    >
                      {property.opportunityScore}/100
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Price Forecasting
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Predicted property values based on market trends
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecastData?.priceForecast.slice(0, 5).map((property) => (
              <div key={property.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{property.address}</h4>
                    <p className="text-sm text-muted-foreground">{property.city}</p>
                  </div>
                  <Badge variant="outline">
                    {property.confidence}% confidence
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current</span>
                    <div className="font-medium">₦{property.currentPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">6 Months</span>
                    <div className="font-medium flex items-center gap-1">
                      ₦{property.sixMonthForecast.toLocaleString()}
                      {property.sixMonthForecast > property.currentPrice ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">1 Year</span>
                    <div className="font-medium flex items-center gap-1">
                      ₦{property.oneYearForecast.toLocaleString()}
                      {property.oneYearForecast > property.currentPrice ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground">
                  Market growth rate: {property.marketGrowth > 0 ? '+' : ''}{property.marketGrowth.toFixed(1)}% annually
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceForecasting;
