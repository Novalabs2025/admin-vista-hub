
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

const MarketComparisonChart = () => {
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ["marketComparison"],
    queryFn: async () => {
      const [properties, marketData] = await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .eq("status", "approved"),
        supabase
          .from("market_data")
          .select("*")
          .order("data_date", { ascending: true })
      ]);

      if (properties.error) throw properties.error;
      if (marketData.error) throw marketData.error;

      // Group properties by location and type
      const propertyByLocation = properties.data?.reduce((acc: any, property) => {
        const location = `${property.city}, ${property.state}`;
        if (!acc[location]) {
          acc[location] = {
            location,
            properties: [],
            avgPrice: 0,
            count: 0,
            avgPricePerSqm: 0
          };
        }
        acc[location].properties.push(property);
        acc[location].count += 1;
        return acc;
      }, {});

      // Calculate averages for your properties
      const yourPropertiesByLocation = Object.values(propertyByLocation || {}).map((loc: any) => {
        const avgPrice = loc.properties.reduce((sum: number, p: any) => sum + Number(p.price), 0) / loc.count;
        const avgPricePerSqm = loc.properties
          .filter((p: any) => p.area)
          .reduce((sum: number, p: any) => sum + (Number(p.price) / Number(p.area)), 0) / 
          loc.properties.filter((p: any) => p.area).length || 0;
        
        return {
          ...loc,
          avgPrice: Math.round(avgPrice),
          avgPricePerSqm: Math.round(avgPricePerSqm)
        };
      });

      // Match with market data
      const comparisonData = yourPropertiesByLocation.map(yourData => {
        const marketMatch = marketData.data?.find(
          market => market.location.toLowerCase().includes(yourData.location.toLowerCase()) ||
                    yourData.location.toLowerCase().includes(market.location.toLowerCase())
        );
        
        return {
          location: yourData.location,
          yourAvgPrice: yourData.avgPrice,
          marketAvgPrice: marketMatch?.avg_price || 0,
          yourPricePerSqm: yourData.avgPricePerSqm,
          marketPricePerSqm: marketMatch?.avg_price_per_sqm || 0,
          propertyCount: yourData.count,
          marketListings: marketMatch?.total_listings || 0,
          demandScore: marketMatch?.demand_score || 0
        };
      });

      // Price trend data
      const priceTrends = marketData.data?.map(market => ({
        date: new Date(market.data_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        marketPrice: market.avg_price,
        location: market.location
      })) || [];

      return {
        locationComparison: comparisonData,
        priceTrends: priceTrends.slice(-12) // Last 12 months
      };
    },
  });

  const chartConfig = {
    yourAvgPrice: {
      label: "Your Properties",
      color: "hsl(var(--primary))",
    },
    marketAvgPrice: {
      label: "Market Average",
      color: "hsl(142, 76%, 36%)",
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
            <CardTitle>Price Comparison by Location</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your properties vs market average
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={comparisonData?.locationComparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="location" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: any, name: string) => [
                    `₦${Number(value).toLocaleString()}`,
                    name === "yourAvgPrice" ? "Your Properties" : "Market Average"
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="yourAvgPrice" 
                  fill="var(--color-yourAvgPrice)" 
                  name="Your Properties"
                />
                <Bar 
                  dataKey="marketAvgPrice" 
                  fill="var(--color-marketAvgPrice)" 
                  name="Market Average"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Demand Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Demand scores and listing counts by location
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData?.locationComparison.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{location.location}</div>
                    <div className="text-sm text-muted-foreground">
                      {location.propertyCount} your properties, {location.marketListings} market listings
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={location.demandScore >= 7 ? "default" : location.demandScore >= 4 ? "secondary" : "destructive"}
                    >
                      Demand: {location.demandScore}/10
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
          <CardTitle>Market Price Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historical price movements in key markets
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <LineChart data={comparisonData?.priceTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, "Market Price"]}
              />
              <Line 
                type="monotone" 
                dataKey="marketPrice" 
                stroke="var(--color-marketAvgPrice)" 
                strokeWidth={2}
                name="Market Price"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketComparisonChart;
