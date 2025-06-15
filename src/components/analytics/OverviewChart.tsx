
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface DailyAnalytics {
  date: string;
  total_properties: number;
  new_properties: number;
  total_agents: number;
  new_agents: number;
  total_leads: number;
  new_leads: number;
  total_revenue: number;
}

interface OverviewChartProps {
  data: DailyAnalytics[];
}

const chartConfig = {
  properties: {
    label: "Properties",
    color: "hsl(var(--primary))",
  },
  agents: {
    label: "Agents", 
    color: "hsl(142, 76%, 36%)",
  },
  leads: {
    label: "Leads",
    color: "hsl(346, 87%, 43%)",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(262, 83%, 58%)",
  },
};

const OverviewChart = ({ data }: OverviewChartProps) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    properties: item.total_properties,
    agents: item.total_agents,
    leads: item.total_leads,
    revenue: Math.round(item.total_revenue / 1000), // Convert to thousands for better display
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Growth Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="properties"
              stroke="var(--color-properties)"
              strokeWidth={2}
              dot={{ fill: "var(--color-properties)" }}
            />
            <Line
              type="monotone"
              dataKey="agents"
              stroke="var(--color-agents)"
              strokeWidth={2}
              dot={{ fill: "var(--color-agents)" }}
            />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="var(--color-leads)"
              strokeWidth={2}
              dot={{ fill: "var(--color-leads)" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ fill: "var(--color-revenue)" }}
              name="Revenue (₦K)"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default OverviewChart;
