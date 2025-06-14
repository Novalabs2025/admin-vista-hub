
import { useEffect } from "react";
import StatCard from "./StatCard";
import { Briefcase, Users, MessageSquare, Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const StatCards = () => {
  const queryClient = useQueryClient();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const { count: propertiesCount, error: propertiesError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      if (propertiesError) throw propertiesError;

      const { count: agentsCount, error: agentsError } = await supabase
        .from("agent_verifications")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      if (agentsError) throw agentsError;

      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: leadsCount, error: leadsError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth);
        
      if (leadsError) throw leadsError;

      return {
        activeProperties: propertiesCount ?? 0,
        verifiedAgents: agentsCount ?? 0,
        conversations: leadsCount ?? 0,
      };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_verifications" },
        () => queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
      )
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
      title: "Conversations/Month",
      value: statsData?.conversations.toLocaleString() ?? "0",
      icon: MessageSquare,
    },
    {
      title: "Average Rating",
      value: "N/A",
      icon: Star,
      isRating: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} isRating={stat.title === "Average Rating" && stat.value !== "N/A"} />
      ))}
    </div>
  );
};

export default StatCards;
