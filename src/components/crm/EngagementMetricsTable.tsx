
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSuccessMetrics } from '@/hooks/useSuccessMetrics';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function EngagementMetricsTable() {
  const { engagementMetrics, isLoading } = useSuccessMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMetricColor = (type: string) => {
    const colors: Record<string, string> = {
      'message': 'bg-blue-100 text-blue-800',
      'call': 'bg-green-100 text-green-800',
      'email': 'bg-purple-100 text-purple-800',
      'property_view': 'bg-orange-100 text-orange-800',
      'appointment_book': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Engagement Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Seeker ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engagementMetrics?.slice(0, 10).map((metric) => (
              <TableRow key={metric.id}>
                <TableCell>
                  <Badge className={getMetricColor(metric.metric_type)}>
                    {metric.metric_type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{metric.metric_value}</TableCell>
                <TableCell>
                  {format(new Date(metric.interaction_date), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {metric.seeker_id ? metric.seeker_id.slice(0, 8) + '...' : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
