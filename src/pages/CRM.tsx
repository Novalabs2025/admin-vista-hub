
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, TrendingUp, Clock } from 'lucide-react';
import AppointmentsTable from '@/components/crm/AppointmentsTable';
import DealsTable from '@/components/crm/DealsTable';
import { useAppointments } from '@/hooks/useAppointments';
import { useDeals } from '@/hooks/useDeals';
import { useInteractions } from '@/hooks/useInteractions';

export default function CRM() {
  const { appointments } = useAppointments();
  const { deals } = useDeals();
  const { interactions } = useInteractions();

  const todayAppointments = appointments?.filter(apt => {
    const today = new Date().toDateString();
    const appointmentDate = new Date(apt.appointment_date).toDateString();
    return appointmentDate === today;
  });

  const activeDeals = deals?.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage));
  const wonDeals = deals?.filter(deal => deal.stage === 'closed_won');
  const totalRevenue = wonDeals?.reduce((sum, deal) => sum + (deal.deal_value || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-gray-600">Manage appointments, track deals, and monitor interactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {appointments?.filter(apt => apt.status === 'scheduled').length || 0} scheduled total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {wonDeals?.length || 0} deals won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {wonDeals?.length || 0} closed deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total client interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <Card>
            <CardContent className="p-6">
              <AppointmentsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardContent className="p-6">
              <DealsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>Client Interactions</CardTitle>
              <CardDescription>
                Track all communications and interactions with potential clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Interaction tracking component coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
