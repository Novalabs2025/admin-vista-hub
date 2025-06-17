
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuccessMetrics } from '@/hooks/useSuccessMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResponseTimeChart() {
  const { conversationAnalytics, isLoading } = useSuccessMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  // Group conversations by response time ranges
  const responseTimeRanges = [
    { range: '0-5 min', min: 0, max: 5, count: 0 },
    { range: '5-15 min', min: 5, max: 15, count: 0 },
    { range: '15-30 min', min: 15, max: 30, count: 0 },
    { range: '30-60 min', min: 30, max: 60, count: 0 },
    { range: '1+ hours', min: 60, max: Infinity, count: 0 }
  ];

  conversationAnalytics?.forEach(conv => {
    const responseTime = conv.avg_response_time_minutes || 0;
    const range = responseTimeRanges.find(r => responseTime >= r.min && responseTime < r.max);
    if (range) range.count++;
  });

  const chartData = responseTimeRanges.map(range => ({
    range: range.range,
    count: range.count
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
