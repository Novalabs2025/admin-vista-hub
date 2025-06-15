
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, Building2, DollarSign, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KPIData {
  totalProperties?: number;
  totalAgents?: number;
  totalRevenue?: number;
  totalLeads?: number;
  propertyGrowth?: number;
  agentGrowth?: number;
  revenueGrowth?: number;
  leadGrowth?: number;
}

interface AnalyticsKPIsProps {
  data?: KPIData;
}

const AnalyticsKPIs = ({ data }: AnalyticsKPIsProps) => {
  const kpis = [
    {
      title: "Total Properties",
      value: data?.totalProperties?.toLocaleString() || "0",
      icon: Building2,
      trend: data?.propertyGrowth || 0,
      color: "text-blue-600"
    },
    {
      title: "Active Agents",
      value: data?.totalAgents?.toLocaleString() || "0",
      icon: Users,
      trend: data?.agentGrowth || 0,
      color: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: `₦${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: data?.revenueGrowth || 0,
      color: "text-purple-600"
    },
    {
      title: "Total Leads",
      value: data?.totalLeads?.toLocaleString() || "0",
      icon: Target,
      trend: data?.leadGrowth || 0,
      color: "text-orange-600"
    }
  ];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "bg-green-100 text-green-800";
    if (trend < 0) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(kpi.trend)}
              <Badge variant="secondary" className={getTrendColor(kpi.trend)}>
                {Math.abs(kpi.trend).toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsKPIs;
