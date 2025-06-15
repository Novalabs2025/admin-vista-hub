
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const MarketTrends = () => {
  const { data: marketData, isLoading } = useQuery({
    queryKey: ["marketTrends"],
    queryFn: async () => {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("price, property_type, city, state, created_at")
        .eq("status", "approved");

      if (error) throw error;

      // Calculate average prices by property type
      const pricesByType = properties.reduce((acc: any, property) => {
        const type = property.property_type;
        if (!acc[type]) {
          acc[type] = { total: 0, count: 0, prices: [] };
        }
        acc[type].total += Number(property.price);
        acc[type].count += 1;
        acc[type].prices.push(Number(property.price));
        return acc;
      }, {});

      const avgPricesByType = Object.entries(pricesByType).map(([type, data]: [string, any]) => ({
        property_type: type,
        avg_price: Math.round(data.total / data.count),
        count: data.count
      }));

      // Calculate average prices by location
      const pricesByLocation = properties.reduce((acc: any, property) => {
        const location = `${property.city}, ${property.state}`;
        if (!acc[location]) {
          acc[location] = { total: 0, count: 0 };
        }
        acc[location].total += Number(property.price);
        acc[location].count += 1;
        return acc;
      }, {});

      const avgPricesByLocation = Object.entries(pricesByLocation)
        .map(([location, data]: [string, any]) => ({
          location,
          avg_price: Math.round(data.total / data.count),
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Monthly trends
      const monthlyTrends = properties.reduce((acc: any, property) => {
        const month = new Date(property.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = { month, total: 0, count: 0 };
        }
        
        acc[month].total += Number(property.price);
        acc[month].count += 1;
        
        return acc;
      }, {});

      const monthlyAvgPrices = Object.values(monthlyTrends).map((item: any) => ({
        ...item,
        avg_price: Math.round(item.total / item.count)
      }));

      return {
        pricesByType: avgPricesByType,
        pricesByLocation: avgPricesByLocation,
        monthlyTrends: monthlyAvgPrices
      };
    },
  });

  const chartConfig = {
    avg_price: {
      label: "Average Price (₦)",
      color: "hsl(var(--primary))",
    },
    count: {
      label: "Listings",
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
            <CardTitle>Average Prices by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={marketData?.pricesByType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="property_type" />
                <YAxis />
                <Tooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: any, name: string) => [
                    name === "avg_price" ? `₦${Number(value).toLocaleString()}` : value,
                    name === "avg_price" ? "Average Price" : "Listings"
                  ]}
                />
                <Bar dataKey="avg_price" fill="var(--color-avg_price)" name="Average Price" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Locations by Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={marketData?.pricesByLocation || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: any, name: string) => [
                    name === "avg_price" ? `₦${Number(value).toLocaleString()}` : value,
                    name === "avg_price" ? "Average Price" : "Listings"
                  ]}
                />
                <Bar dataKey="count" fill="var(--color-count)" name="Listings" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <LineChart data={marketData?.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any, name: string) => [
                  name === "avg_price" ? `₦${Number(value).toLocaleString()}` : value,
                  name === "avg_price" ? "Average Price" : "Listings"
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="avg_price" 
                stroke="var(--color-avg_price)" 
                strokeWidth={2}
                name="Average Price"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketTrends;
