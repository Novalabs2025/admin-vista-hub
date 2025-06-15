
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const RevenueAnalytics = () => {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenueAnalytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, created_at, status")
        .eq("status", "Paid")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by month for better visualization
      const monthlyRevenue = data.reduce((acc: any, payment) => {
        const month = new Date(payment.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = { month, revenue: 0, count: 0 };
        }
        
        acc[month].revenue += Number(payment.amount);
        acc[month].count += 1;
        
        return acc;
      }, {});

      return Object.values(monthlyRevenue) as any[];
    },
  });

  const chartConfig = {
    revenue: {
      label: "Revenue (₦)",
      color: "hsl(var(--primary))",
    },
    count: {
      label: "Transactions",
      color: "hsl(142, 76%, 36%)",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalRevenue = revenueData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalTransactions = revenueData?.reduce((sum, item) => sum + item.count, 0) || 0;
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{avgTransactionValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue (₦)" />
              <Bar dataKey="count" fill="var(--color-count)" name="Transactions" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalytics;
