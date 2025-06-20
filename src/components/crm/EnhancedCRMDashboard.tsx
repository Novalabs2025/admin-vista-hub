
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import AppointmentsTable from './AppointmentsTable';
import DealsTable from './DealsTable';
import SuccessMetricsOverview from './SuccessMetricsOverview';
import ConversionFunnel from './ConversionFunnel';
import ResponseTimeChart from './ResponseTimeChart';
import EngagementMetricsTable from './EngagementMetricsTable';
import { useAppointments } from '@/hooks/useAppointments';
import { useDeals } from '@/hooks/useDeals';
import { useInteractions } from '@/hooks/useInteractions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EnhancedCRMDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { appointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useAppointments();
  const { deals, isLoading: dealsLoading, refetch: refetchDeals } =Deals();
  const { interactions, isLoading: interactionsLoading, refetch: refetchInteractions } = useInteractions();

  const todayAppointments = appointments?.filter(apt => {
    const today = new Date().toDateString();
    const appointmentDate = new Date(apt.appointment_date).toDateString();
    return appointmentDate === today;
  });

  const activeDeals = deals?.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage));
  const wonDeals = deals?.filter(deal => deal.stage === 'closed_won');
  const totalRevenue = wonDeals?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0;

  const handleRefreshAll = () => {
    refetchAppointments();
    refetchDeals();
    refetchInteractions();
  };

  const exportData = (type: string) => {
    // Implementation for exporting data
    console.log(`Exporting ${type} data...`);
  };

  const isLoading = appointmentsLoading || dealsLoading || interactionsLoading;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage appointments, track deals, and monitor performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments, deals, or contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Cardiff className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {appointments?.filter(apt => apt.status === 'scheduled').length || 0} scheduled
              </Badge>
              <p className="text-xs text-muted-foreground">
                total appointments
              </p>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals?.length || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {wonDeals?.length || 0} won
              </Badge>
              <p className="text-xs text-muted-foreground">
                deals closed
              </p>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {wonDeals?.length || 0} deals
              </Badge>
              <p className="text-xs text-muted-foreground">
                from closed deals
              </p>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactions?.length || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
              <p className="text-xs text-muted-foreground">
                client interactions
              </p>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
        </Card>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-100">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-green-100">
              Deals
            </TabsTrigger>
            <TabsTrigger value="interactions" className="data-[state=active]:bg-orange-100">
              Interactions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-100">
              Analytics
            </TabsTrigger>
          </TabsList>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportData('appointments')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Appointments Management
              </CardTitle>
              <CardDescription>
                Schedule and manage property viewings and meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <AppointmentsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Deals Pipeline
              </CardTitle>
              <CardDescription>
                Track and manage your sales pipeline and opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <DealsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Interactions
              </CardTitle>
              <CardDescription>
                Track all communications and interactions with potential clients
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Interaction Tracking</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Monitor and analyze all client communications, calls, emails, and meetings in one place.
                  This feature helps you understand client engagement patterns and improve response times.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Log New Interaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Success Metrics Overview */}
          <SuccessMetricsOverview />
          
          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversionFunnel />
            <ResponseTimeChart />
          </div>
          
          {/* Engagement Metrics Table */}
          <EngagementMetricsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
