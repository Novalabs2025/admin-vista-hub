
import AgentManagementTable from "@/components/agents/AgentManagementTable";

const Agents = () => {
  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor all agents in your platform with comprehensive insights and verification tools.
        </p>
      </div>
      <AgentManagementTable />
    </main>
  );
};

export default Agents;
