
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

const AgentPerformance = () => {
  const { data: agentData, isLoading } = useQuery({
    queryKey: ["agentPerformance"],
    queryFn: async () => {
      const { data: agents, error } = await supabase
        .from("agent_verifications")
        .select(`
          user_id,
          status,
          created_at
        `)
        .eq("status", "approved");

      if (error) throw error;

      // Get property counts per agent
      const agentStats = await Promise.all(
        agents.map(async (agent) => {
          const [properties, leads] = await Promise.all([
            supabase
              .from("properties")
              .select("id", { count: "exact" })
              .eq("agent_id", agent.user_id),
            supabase
              .from("leads")
              .select("id", { count: "exact" })
              .eq("agent_id", agent.user_id)
          ]);

          return {
            agent_id: agent.user_id,
            properties_count: properties.count || 0,
            leads_count: leads.count || 0,
            joined_date: agent.created_at
          };
        })
      );

      return agentStats.sort((a, b) => b.properties_count - a.properties_count);
    },
  });

  const chartConfig = {
    properties: {
      label: "Properties",
      color: "hsl(var(--primary))",
    },
    leads: {
      label: "Leads",
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

  const totalAgents = agentData?.length || 0;
  const activeAgents = agentData?.filter(agent => agent.properties_count > 0).length || 0;
  const topPerformer = agentData?.[0];

  const chartData = agentData?.slice(0, 10).map((agent, index) => ({
    agent: `Agent ${index + 1}`,
    properties: agent.properties_count,
    leads: agent.leads_count
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              {totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformer?.properties_count || 0}</div>
            <p className="text-xs text-muted-foreground">properties listed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agent" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="properties" fill="var(--color-properties)" name="Properties" />
              <Bar dataKey="leads" fill="var(--color-leads)" name="Leads" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentData?.slice(0, 10).map((agent, index) => (
              <div key={agent.agent_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Agent {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(agent.joined_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {agent.properties_count} properties
                  </Badge>
                  <Badge variant="outline">
                    {agent.leads_count} leads
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentPerformance;
