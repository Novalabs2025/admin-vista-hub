
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuccessMetrics } from '@/hooks/useSuccessMetrics';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConversionFunnel() {
  const { conversionTracking, isLoading } = useSuccessMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { name: 'Leads', key: 'lead', color: 'bg-blue-500' },
    { name: 'Qualified', key: 'qualified', color: 'bg-indigo-500' },
    { name: 'Appointments', key: 'appointment', color: 'bg-purple-500' },
    { name: 'Viewings', key: 'viewing', color: 'bg-pink-500' },
    { name: 'Offers', key: 'offer', color: 'bg-orange-500' },
    { name: 'Deals', key: 'deal', color: 'bg-green-500' }
  ];

  const stageCounts = stages.map(stage => ({
    ...stage,
    count: conversionTracking?.filter(conv => conv.conversion_stage === stage.key).length || 0
  }));

  const maxCount = Math.max(...stageCounts.map(stage => stage.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stageCounts.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const conversionRate = index > 0 && stageCounts[index - 1].count > 0 
              ? ((stage.count / stageCounts[index - 1].count) * 100).toFixed(1)
              : '100.0';

            return (
              <div key={stage.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stage.count} ({conversionRate}%)
                    </span>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-3"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
