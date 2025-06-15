
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pie, PieChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(346, 87%, 43%)', 'hsl(262, 83%, 58%)', 'hsl(43, 96%, 56%)'];

const PropertyAnalytics = () => {
  const { data: propertyData, isLoading } = useQuery({
    queryKey: ["propertyAnalytics"],
    queryFn: async () => {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*");

      if (error) throw error;

      // Status distribution
      const statusDistribution = properties.reduce((acc: any, property) => {
        acc[property.status] = (acc[property.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count as number / properties.length) * 100)
      }));

      // Property type distribution
      const typeDistribution = properties.reduce((acc: any, property) => {
        acc[property.property_type] = (acc[property.property_type] || 0) + 1;
        return acc;
      }, {});

      const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
        type,
        count
      }));

      // Price ranges
      const priceRanges = [
        { range: "Under ₦1M", min: 0, max: 1000000 },
        { range: "₦1M - ₦5M", min: 1000000, max: 5000000 },
        { range: "₦5M - ₦10M", min: 5000000, max: 10000000 },
        { range: "₦10M - ₦20M", min: 10000000, max: 20000000 },
        { range: "Above ₦20M", min: 20000000, max: Infinity }
      ];

      const priceData = priceRanges.map(range => ({
        range: range.range,
        count: properties.filter(p => 
          Number(p.price) >= range.min && Number(p.price) < range.max
        ).length
      }));

      // Monthly listings
      const monthlyListings = properties.reduce((acc: any, property) => {
        const month = new Date(property.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const monthlyData = Object.entries(monthlyListings).map(([month, count]) => ({
        month,
        count
      }));

      return {
        statusData,
        typeData,
        priceData,
        monthlyData,
        totalProperties: properties.length
      };
    },
  });

  const chartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--primary))",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const approvedProperties = propertyData?.statusData.find(s => s.status === 'approved')?.count || 0;
  const pendingProperties = propertyData?.statusData.find(s => s.status === 'pending')?.count || 0;
  const rejectedProperties = propertyData?.statusData.find(s => s.status === 'rejected')?.count || 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertyData?.totalProperties || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedProperties}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingProperties}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedProperties}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <PieChart>
                <Pie
                  data={propertyData?.statusData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }: { status: string; percentage: number }) => `${status} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {propertyData?.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={propertyData?.typeData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Price Range Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={propertyData?.priceData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={propertyData?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyAnalytics;
