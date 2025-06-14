
import { Button } from "@/components/ui/button";
import { Bell, UserCircle, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/60 backdrop-blur-md px-4 sm:px-6">
        <SidebarTrigger className="sm:hidden">
            <Menu />
        </SidebarTrigger>
        <div className="flex-1">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">System Management</p>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="destructive" size="sm" className="gap-2">
                <Bell size={16} />
                <span>3 Pending Actions</span>
            </Button>
            <UserCircle size={32} className="text-muted-foreground" />
        </div>
    </header>
  );
};
export default Header;
