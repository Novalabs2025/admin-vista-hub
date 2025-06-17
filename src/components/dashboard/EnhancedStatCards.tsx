
import { useEffect } from "react";
import StatCard from "./StatCard";
import LeadCreditCard from "./LeadCreditCard";
import { Briefcase, Users, MessageSquare, Star, TrendingUp } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const EnhancedStatCards = () => {
  const queryClient = useQueryClient();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["enhancedDashboardStats"],
    queryFn: async () => {
      const [properties, agents, leads, deals, monthlyLeads] = await Promise.all([
        supabase.from("properties").select("*", { count: "exact", head: true }),
        supabase.from("agent_verifications").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("deals").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      return {
        activeProperties: properties.count ?? 0,
        verifiedAgents: agents.count ?? 0,
        totalLeads: leads.count ?? 0,
        activeDeals: deals.count ?? 0,
        monthlyLeads: monthlyLeads.count ?? 0,
      };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("enhanced-dashboard-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, 
        () => queryClient.invalidateQueries({ queryKey: ["enhancedDashboardStats"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_verifications" }, 
        () => queryClient.invalidateQueries({ queryKey: ["enhancedDashboardStats"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, 
        () => queryClient.invalidateQueries({ queryKey: ["enhancedDashboardStats"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, 
        () => queryClient.invalidateQueries({ queryKey: ["enhancedDashboardStats"] }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const stats = [
    {
      title: "Active Properties",
      value: statsData?.activeProperties.toLocaleString() ?? "0",
      icon: Briefcase,
    },
    {
      title: "Verified Agents",
      value: statsData?.verifiedAgents.toLocaleString() ?? "0",
      icon: Users,
    },
    {
      title: "Total Leads",
      value: statsData?.totalLeads.toLocaleString() ?? "0",
      icon: MessageSquare,
    },
    {
      title: "Active Deals",
      value: statsData?.activeDeals.toLocaleString() ?? "0",
      icon: TrendingUp,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
      ))}
      <LeadCreditCard />
    </div>
  );
};

export default EnhancedStatCards;
