
import Header from "@/components/dashboard/Header";
import StatCards from "@/components/dashboard/StatCards";
import AgentVerificationTable from "@/components/dashboard/AgentVerificationTable";

const Index = () => {
  return (
    <div className="flex flex-col flex-1 h-full">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <StatCards />
        <AgentVerificationTable />
      </main>
    </div>
  );
};

export default Index;
