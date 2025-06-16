import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Plus, RefreshCw, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import InvoiceModal, { Payment } from './InvoiceModal';
import CreatePaymentModal from './CreatePaymentModal';

const PaymentsHistory = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [methodFilter, setMethodFilter] = React.useState("All");
  const [dateFilter, setDateFilter] = React.useState("All");
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [isInvoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime-payments-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          console.log('Payment change received!', payload);
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: payments, isLoading, error, refetch } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw new Error(paymentsError.message);
      if (!paymentsData) return [];

      const userIds = [...new Set(paymentsData.map(p => p.user_id))];
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw new Error(profilesError.message);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]));

      return paymentsData.map(p => ({
        id: p.transaction_id,
        agent: profilesMap.get(p.user_id) || 'Unknown Agent',
        amount: p.amount,
        status: p.status,
        date: format(new Date(p.created_at), 'yyyy-MM-dd'),
        method: p.payment_method || 'N/A',
      }));
    },
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!payments) return { totalRevenue: 0, totalTransactions: 0, paidTransactions: 0, pendingTransactions: 0 };
    
    const totalRevenue = payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalTransactions = payments.length;
    const paidTransactions = payments.filter(p => p.status === 'Paid').length;
    const pendingTransactions = payments.filter(p => p.status === 'Pending').length;
    
    return { totalRevenue, totalTransactions, paidTransactions, pendingTransactions };
  }, [payments]);

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = payment.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "All" || payment.method === methodFilter;
    
    let matchesDate = true;
    if (dateFilter !== "All") {
      const paymentDate = new Date(payment.date);
      const now = new Date();
      
      switch (dateFilter) {
        case "Today":
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case "Week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        case "Month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  }) || [];

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setInvoiceModalOpen(true);
  };

  const handlePaymentCreated = () => {
    setCreateModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Transaction ID', 'Agent', 'Amount', 'Date', 'Method', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        payment.id,
        payment.agent,
        payment.amount,
        payment.date,
        payment.method,
        payment.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold">{stats.paidTransactions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
                </div>
                <Filter className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Payments Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Payment Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Track and manage all payment transactions with comprehensive filtering and analytics
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Payment
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by agent or transaction ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Methods</SelectItem>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="N/A">Not Specified</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Time</SelectItem>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="Week">Last 7 Days</SelectItem>
                  <SelectItem value="Month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredPayments.length}</span> of{' '}
                <span className="font-medium">{payments?.length || 0}</span> transactions
              </div>
              {(searchTerm || statusFilter !== "All" || methodFilter !== "All" || dateFilter !== "All") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                    setMethodFilter("All");
                    setDateFilter("All");
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Enhanced Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold">Transaction ID</TableHead>
                    <TableHead className="font-semibold">Agent</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-red-500 font-medium">Error fetching payments</div>
                        <div className="text-sm text-gray-500 mt-1">{error.message}</div>
                        <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-3">
                          Try Again
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium font-mono text-sm">
                          {payment.id}
                        </TableCell>
                        <TableCell className="font-medium">{payment.agent}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₦{payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-600">{payment.date}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {payment.method}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusBadgeVariant(payment.status)}
                            className={getStatusColor(payment.status)}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewInvoice(payment)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            View Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <CreditCard className="h-12 w-12 text-gray-300" />
                          <div className="text-gray-500 font-medium">No payments found</div>
                          <div className="text-sm text-gray-400">
                            {searchTerm || statusFilter !== "All" || methodFilter !== "All" || dateFilter !== "All"
                              ? "Try adjusting your filters"
                              : "Get started by creating your first payment"
                            }
                          </div>
                          {(!searchTerm && statusFilter === "All" && methodFilter === "All" && dateFilter === "All") && (
                            <Button onClick={() => setCreateModalOpen(true)} className="mt-2">
                              Create First Payment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        payment={selectedPayment}
      />
      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handlePaymentCreated}
      />
    </>
  );
};

export default PaymentsHistory;
