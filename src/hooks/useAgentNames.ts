
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAgentNames = () => {
  return useQuery({
    queryKey: ["agent-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .not("full_name", "is", null);

      if (error) throw error;
      
      // Create a map of agent_id to full_name for easy lookup
      const agentNamesMap: Record<string, string> = {};
      data.forEach((profile) => {
        if (profile.full_name) {
          agentNamesMap[profile.id] = profile.full_name;
        }
      });

      return agentNamesMap;
    },
  });
};
