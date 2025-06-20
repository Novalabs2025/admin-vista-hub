
import Header from "@/components/dashboard/Header";
import EnhancedStatCards from "@/components/dashboard/EnhancedStatCards";
import LeadManagementCard from "@/components/dashboard/LeadManagementCard";
import RecentLeadsCard from "@/components/dashboard/RecentLeadsCard";
import EnhancedAgentVerificationTable from "@/components/dashboard/EnhancedAgentVerificationTable";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { hasRole } = useAuth();

  return (
    <div className="flex flex-col flex-1 h-full">
      <Header />
      <main className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-auto">
        {hasRole('admin') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Advanced Analytics Available</h3>
                <p className="text-blue-700">Access comprehensive analytics and insights for your platform.</p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </div>
        )}
        
        <EnhancedStatCards />
        
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <LeadManagementCard />
          <RecentLeadsCard />
        </div>
        
        <AnalyticsChart />
        <EnhancedAgentVerificationTable />
      </main>
    </div>
  );
};

export default Index;
