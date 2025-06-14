
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
            {children}
        </div>
      </div>
    </SidebarProvider>
  );
};
export default DashboardLayout;
