
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSuccessMetrics } from '@/hooks/useSuccessMetrics';
import { Clock, TrendingUp, MessageSquare, Target, DollarSign, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuccessMetricsOverview() {
  const { 
    conversationAnalytics, 
    engagementMetrics, 
    conversionTracking, 
    isLoading 
  } = useSuccessMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  // Calculate aggregate metrics
  const totalConversations = conversationAnalytics?.length || 0;
  const avgResponseTime = conversationAnalytics?.reduce((acc, conv) => acc + (conv.avg_response_time_minutes || 0), 0) / totalConversations || 0;
  const totalEngagements = engagementMetrics?.length || 0;
  
  const conversionStages = ['lead', 'qualified', 'appointment', 'viewing', 'offer', 'deal'];
  const conversionCounts = conversionStages.map(stage => 
    conversionTracking?.filter(conv => conv.conversion_stage === stage).length || 0
  );
  const conversionRate = conversionCounts[0] > 0 ? (conversionCounts[conversionCounts.length - 1] / conversionCounts[0]) * 100 : 0;
  
  const totalDealValue = conversionTracking
    ?.filter(conv => conv.conversion_stage === 'deal')
    .reduce((acc, conv) => acc + (conv.conversion_value || 0), 0) || 0;

  const metrics = [
    {
      title: "Total Conversations",
      value: totalConversations.toString(),
      icon: MessageSquare,
      color: "text-blue-600",
      description: "Active conversations"
    },
    {
      title: "Avg Response Time",
      value: `${Math.round(avgResponseTime)}m`,
      icon: Clock,
      color: "text-green-600",
      description: "Minutes to respond"
    },
    {
      title: "Total Engagements",
      value: totalEngagements.toString(),
      icon: Users,
      color: "text-purple-600",
      description: "Client interactions"
    },
    {
      title: "Conversion Rate",
      value: `${Math.round(conversionRate)}%`,
      icon: Target,
      color: "text-orange-600",
      description: "Lead to deal conversion"
    },
    {
      title: "Total Deal Value",
      value: `₦${totalDealValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      description: "Closed deal value"
    },
    {
      title: "Active Leads",
      value: conversionCounts[0].toString(),
      icon: TrendingUp,
      color: "text-indigo-600",
      description: "Current pipeline"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
