
import * as React from "react"
import {
  BarChart3,
  Building2,
  Home,
  MessageSquare,
  Settings,
  Users,
  CreditCard,
  Bell,
  TrendingUp,
  Shield,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAdmin, isSuperAdmin } = useAuth()

  const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Analytics",
      url: "/analytics", 
      icon: BarChart3,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: Users,
    },
    {
      title: "Properties", 
      url: "/properties",
      icon: Building2,
    },
    {
      title: "Property Performance",
      url: "/property-performance",
      icon: TrendingUp,
    },
    {
      title: "Payments",
      url: "/payments", 
      icon: CreditCard,
    },
    {
      title: "Communications",
      url: "/communications",
      icon: MessageSquare,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    // Add Super Admin option only for super admins
    ...(isSuperAdmin() ? [{
      title: "Super Admin",
      url: "/super-admin",
      icon: Shield,
    }] : []),
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center">
            <Building2 className="text-primary-foreground h-4 w-4" />
          </div>
          <span className="font-semibold text-lg">SettleSmart AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
