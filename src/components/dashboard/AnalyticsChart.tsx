
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { month: 'January', agents: 12 },
  { month: 'February', agents: 19 },
  { month: 'March', agents: 3 },
  { month: 'April', agents: 5 },
  { month: 'May', agents: 2 },
  { month: 'June', agents: 3 },
];

const chartConfig = {
  agents: {
    label: "New Agents",
    color: "hsl(var(--primary))",
  },
};

const AnalyticsChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Growth</CardTitle>
        <CardDescription>New agents onboarded per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis />
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="agents" fill="var(--color-agents)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
