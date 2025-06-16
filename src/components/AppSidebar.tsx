
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Settings, Building2, Bell, FileText, Home, BarChart3, TrendingUp, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const location = useLocation();
  const { hasRole, user, roles } = useAuth();

  // Debug logging to help identify role issues
  console.log("User roles:", roles);
  console.log("User has admin role:", hasRole('admin'));
  console.log("Current user:", user?.email);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center">
                <Building2 className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">SettleSmart AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                            <Link to="/">
                                <LayoutDashboard size={16}/>
                                Dashboard
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/properties'}>
                            <Link to="/properties">
                                <Home size={16}/>
                                Properties
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/property-performance'}>
                            <Link to="/property-performance">
                                <TrendingUp size={16}/>
                                Performance Tracker
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/agents'}>
                            <Link to="/agents">
                                <Users size={16}/>
                                Agents
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/analytics'}>
                            <Link to="/analytics">
                                <BarChart3 size={16}/>
                                Analytics {!hasRole('admin') && "(Admin Only)"}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/communications'}>
                            <Link to="/communications">
                                <MessageSquare size={16}/>
                                Communications
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/notifications'}>
                            <Link to="/notifications">
                                <Bell size={16}/>
                                Notifications
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/payments'}>
                            <Link to="/payments">
                                <FileText size={16}/>
                                Payments
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
                    <Link to="/settings">
                        <Settings size={16}/>
                        Settings {!hasRole('admin') && "(Admin Only)"}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
